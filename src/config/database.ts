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

pool.on("connect", () => {
  console.info('[pool.connect] Database connected successfully')
});

pool.on("error", (err) => {
  console.error("[pool.error] Failed to connect database", err);
  process.exit(1);
});