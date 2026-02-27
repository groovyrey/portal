import { createClient } from '@libsql/client/http';

const url = process.env.TURSO_DATABASE_URL || '';
const authToken = process.env.TURSO_AUTH_TOKEN || '';

const client = createClient({
  url,
  authToken,
});

/**
 * Compatibility wrapper to match the 'pg' query interface
 */
export const query = async (text: string, params: any[] = []) => {
  // Convert $1, $2, ... to ? for SQLite compatibility if needed
  // However, libsql client supports $1 syntax too
  
  // Replace ILIKE with LIKE for SQLite compatibility
  const sqliteText = text.replace(/ILIKE/g, 'LIKE');

  const result = await client.execute({
    sql: sqliteText,
    args: params
  });

  // Transform result to match pg-like structure
  return {
    rows: result.rows.map(row => {
      const obj: any = {};
      result.columns.forEach((col, i) => {
        let value: any = row[i];
        
        // Handle JSON strings
        if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
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
    rowCount: result.rows.length
  };
};

/**
 * Compatibility wrapper for transactions
 */
export const getClient = async () => {
  const transaction = await client.transaction('write');
  
  return {
    query: async (text: string, params: any[] = []) => {
      const trimmedText = text.trim().toUpperCase();
      if (trimmedText === 'BEGIN') return { rows: [], rowCount: 0 };
      if (trimmedText === 'COMMIT') {
        await transaction.commit();
        return { rows: [], rowCount: 0 };
      }
      if (trimmedText === 'ROLLBACK') {
        await transaction.rollback();
        return { rows: [], rowCount: 0 };
      }

      const sqliteText = text.replace(/ILIKE/g, 'LIKE');
      const result = await transaction.execute({
        sql: sqliteText,
        args: params
      });
      
      return {
        rows: result.rows.map(row => {
          const obj: any = {};
          result.columns.forEach((col, i) => {
            let value: any = row[i];
            
            // Handle JSON strings
            if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
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
        rowCount: result.rows.length
      };
    },
    release: () => {
      // In libSQL, if transaction is not committed or rolled back, it's rolled back on close.
      // In some implementations, release() is used for connection pooling.
      // We can't easily close it here if it's already finished.
      if (!transaction.closed) {
          // transaction.rollback().catch(() => {}); // Safety
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
