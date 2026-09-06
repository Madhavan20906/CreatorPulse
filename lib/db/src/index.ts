import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/creatorpulse";

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export * from "./schema/index";
