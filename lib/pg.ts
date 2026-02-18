import { Pool, PoolConfig } from 'pg';
import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { attachDatabasePool } from "@vercel/functions";

const region = process.env.PGUS3R_AWS_REGION || 'us-east-1';
const hostname = process.env.PGUS3R_PGHOST || '';
const port = parseInt(process.env.PGUS3R_PGPORT || '5432', 10);
const username = process.env.PGUS3R_PGUSER || 'postgres';
const database = process.env.PGUS3R_PGDATABASE || 'postgres';
const roleArn = process.env.PGUS3R_AWS_ROLE_ARN;

// Signer for AWS IAM authentication
const signer = new Signer({
  hostname,
  port,
  username,
  region,
  credentials: roleArn ? awsCredentialsProvider({
    roleArn: roleArn,
    clientConfig: { region },
  }) : undefined,
});

const poolConfig: PoolConfig = {
  host: hostname,
  port: port,
  user: username,
  database: database,
  // The 'pg' library supports an async function for the password
  password: () => signer.getAuthToken(),
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool(poolConfig);
} else {
  // In development, use a global variable so the pool is preserved across Hot Module Replacement (HMR).
  if (!(global as any).pgPool) {
    (global as any).pgPool = new Pool(poolConfig);
  }
  pool = (global as any).pgPool;
}

// Vercel function optimization for pooling
try {
  attachDatabasePool(pool);
} catch (e) {
  // attachDatabasePool might fail in some local environments, we can safely ignore
}

export { pool };

/**
 * Helper function to execute queries
 */
export const query = (text: string, params?: any[]) => pool.query(text, params);

/**
 * Helper to get a client from the pool for transactions
 */
export const getClient = () => pool.connect();
