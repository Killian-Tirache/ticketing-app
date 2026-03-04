import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import { checkOrigin } from "./middlewares/checkOrigin";
import { limiter } from "./utils/limiter";
import { notFoundMiddleware } from "./middlewares/notFoundMiddleware";
import routes from "./routes/routes";
import { errorMiddleware } from "./middlewares/errorMiddleware";
import { createServer } from "http";
import { initSocket } from "./socket";

dotenv.config();

const REQUIRED_ENV_VARS = [
  "MONGO_URI",
  "FRONTEND_URL",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
];
REQUIRED_ENV_VARS.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required env variable: ${key}`);
    process.exit(1);
  }
});

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT;
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(checkOrigin);
app.use(limiter);
routes.forEach((route) => app.use("/api", route));
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;

if (process.env.NODE_ENV !== "test") {
  initSocket(httpServer);
  mongoose
    .connect(process.env.MONGO_URI as string)
    .then(() => {
      console.log("MongoDB connected");
      httpServer.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection error:", error);
      process.exit(1);
    });
}

if (process.env.NODE_ENV === "production") {
  setInterval(() => {
    fetch(`${process.env.RENDER_EXTERNAL_URL}/health`).catch(() => {});
  }, 14 * 60 * 1000);
}

app.get("/health", (_, res) => res.json({ status: "ok" }));