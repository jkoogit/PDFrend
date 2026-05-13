import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index_sch';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not defined. Database connection might fail.');
}

export const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
