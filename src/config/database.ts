import { Pool } from "pg";
import { ENV } from "./env.js";

const globalForPg = global as unknown as {
  pool?: Pool;
};

export const pool = globalForPg.pool ?? new Pool({
  connectionString: ENV.DATABASE_URL,
});

if (process.env.NODE_ENV !== "production") {
  globalForPg.pool = pool;
}
