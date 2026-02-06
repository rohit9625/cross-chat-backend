import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import chatRoutes from "./routes/chat.route";
import { pool } from "./config/database";
import { initSocket } from "./socket";

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initSocket(server);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);

async function startServer() {
  try {
    // Test DB connection
    await pool.query('SELECT 1')

    console.log('Database connected successfully')

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database', err);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  server.close();
  await pool.end();
  process.exit(0);
})

startServer();
