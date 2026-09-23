// database connection
import { Pool, types } from "pg";
import dotenv from "dotenv";

dotenv.config();

// NEW: DATE columns (type id 1082) normally become JS Date objects, which can show
// the PREVIOUS day because of timezones. This keeps them as plain "2026-10-15" strings.
types.setTypeParser(1082, (value: string) => value);

export const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT) || 5432,
});
