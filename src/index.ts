import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import { pool } from "./config/database";

const app = express();

const PORT = process.env.PORT || 3000

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

async function startServer() {
  try {
    // Test DB connection
    await pool.query('SELECT 1')

    console.log('Database connected successfully')

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database', err);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await pool.end();
  process.exit(0);
})

startServer();
