import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import chatRoutes from "./routes/chat.route";
import { pool } from "./config/database";
import { initSocket } from "./socket";
import { startTranslationWorker, stopTranslationWorker } from "./workers/translation.worker";

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
  const listen = (port: number | string): Promise<void> => {
    return new Promise((resolve, reject) => {
      server.once("error", reject);

      server.listen(port, () => {
        server.off("error", reject);
        resolve();
      });
    });
  };

  try {
    startTranslationWorker();

    await listen(PORT);
    console.info(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    console.error("[startServer] Failed to start server", err);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.warn('[SIGINT] Shutting down...');
  await stopTranslationWorker();
  server.close();
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await stopTranslationWorker();
  process.exit(0);
});

startServer();
