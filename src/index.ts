import { pool } from "./config/database"

async function main() {
  const res = await pool.query('SELECT NOW()')
  console.log(res.rows[0]);
}


(async () => {
  await main();
})()