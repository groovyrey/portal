import { createClient } from '@libsql/client/http';
import * as dotenv from 'dotenv';

// Load environment variables for local scripts
dotenv.config({ path: '.env.local' });

const url = process.env.TURSO_DATABASE_URL || '';
const authToken = process.env.TURSO_AUTH_TOKEN || '';

const client = createClient({
  url,
  authToken,
});

/**
 * Columns that are known to hold JSON-encoded values. Only these are
 * auto-parsed from TEXT to objects/arrays. This prevents accidental parsing
 * of plain string data (e.g. names, encrypted blobs) that happens to start
 * with '[' or '{'.
 */
const JSON_COLUMNS = new Set([
  'settings',
  'badges',
  'available_reports',
  'items',      // schedules
  'details',    // financials / activity_logs / admin_logs
  'data',       // metadata
  'tasks',      // cron_runs
  'results',    // cron_runs
  'likes',      // json_group_array aliases (community)
  'votes',      // json_group_array aliases (community polls)
]);

function isJsonColumn(col: string): boolean {
  return JSON_COLUMNS.has(col.toLowerCase());
}

/**
 * Compatibility wrapper to match the 'pg' query interface
 */
export const query = async (text: string, params: any[] = []) => {
  // Convert $1, $2, ... to ? for SQLite compatibility if needed
  
  // Replace ILIKE with LIKE for SQLite compatibility
  const sqliteText = text.replace(/ILIKE/g, 'LIKE');

  // Sanitize params: LibSQL does not support 'undefined', must be 'null'
  const sanitizedParams = params.map(p => p === undefined ? null : p);

  const result = await client.execute({
    sql: sqliteText,
    args: sanitizedParams
  });

  // Transform result to match pg-like structure
  return {
    rows: result.rows.map(row => {
      const obj: any = {};
      result.columns.forEach((col, i) => {
        let value: any = row[i];
        
        // Handle JSON strings (only for known JSON columns)
        if (isJsonColumn(col) && typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Not JSON, keep as string
          }
        }

        // Handle Date strings (SQLite timestamps are often strings)
        if (typeof value === 'string' && (col.includes('at') || col.includes('date') || col.includes('created') || col.includes('updated'))) {
           const d = new Date(value);
           if (!isNaN(d.getTime())) {
             value = d;
           }
        }

        // Handle Booleans (SQLite stores them as 1/0)
        if (col.startsWith('is_') && (value === 1 || value === 0)) {
           value = value === 1;
        }
        
        obj[col] = value;
      });
      return obj;
    }),
    rowCount: result.rows.length,
    rowsAffected: result.rowsAffected
  };
};

/**
 * Execute multiple statements in a single network round trip.
 * Dramatically faster than sequential `query()` calls for bulk inserts
 * (e.g. syncing a full report card of subjects).
 */
export const batch = async (stmts: { sql: string; args?: any[] }[]) => {
  if (stmts.length === 0) return;
  return client.batch(
    stmts.map(s => ({
      sql: s.sql.replace(/ILIKE/g, 'LIKE'),
      args: (s.args || []).map(p => p === undefined ? null : p),
    })),
    'write'
  );
};

/**
 * Compatibility wrapper for transactions
 */
export const getClient = async () => {
  const transaction = await client.transaction('write');
  
  return {
    query: async (text: string, params: any[] = []) => {
      const trimmedText = text.trim().toUpperCase();
      if (trimmedText === 'BEGIN') return { rows: [], rowCount: 0, rowsAffected: 0 };
      if (trimmedText === 'COMMIT') {
        await transaction.commit();
        return { rows: [], rowCount: 0, rowsAffected: 0 };
      }
      if (trimmedText === 'ROLLBACK') {
        await transaction.rollback();
        return { rows: [], rowCount: 0, rowsAffected: 0 };
      }

      const sqliteText = text.replace(/ILIKE/g, 'LIKE');
      const sanitizedParams = params.map(p => p === undefined ? null : p);

      const result = await transaction.execute({
        sql: sqliteText,
        args: sanitizedParams
      });
      
      return {
        rows: result.rows.map(row => {
          const obj: any = {};
          result.columns.forEach((col, i) => {
            let value: any = row[i];
            
            // Handle JSON strings (only for known JSON columns)
            if (isJsonColumn(col) && typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
              try {
                value = JSON.parse(value);
              } catch (e) {
                // Not JSON, keep as string
              }
            }

            // Handle Date strings
            if (typeof value === 'string' && (col.includes('at') || col.includes('date') || col.includes('created') || col.includes('updated'))) {
               const d = new Date(value);
               if (!isNaN(d.getTime())) {
                 value = d;
               }
            }

            // Handle Booleans
            if (col.startsWith('is_') && (value === 1 || value === 0)) {
               value = value === 1;
            }

            obj[col] = value;
          });
          return obj;
        }),
        rowCount: result.rows.length,
        rowsAffected: result.rowsAffected
      };
    },
    release: () => {
      // If the transaction is still open, roll it back to avoid leaked writes.
      if (!transaction.closed) {
        transaction.rollback().catch(() => {});
      }
    },
    commit: () => transaction.commit(),
    rollback: () => transaction.rollback(),
  };
};

export const pool = {
  query: (text: string, params?: any[]) => query(text, params),
};

export { client };
