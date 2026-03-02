import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { User } from "./models/user.model";

const JWT_SECRET = process.env.JWT_SECRET as string;

let io: SocketIOServer;

export const initSocket = (httpServer: HTTPServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie
          ?.split(";")
          .find((c) => c.trim().startsWith("token="))
          ?.split("=")[1];

      if (!token) {
        return next(new Error("TOKEN_MISSING"));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        role: string;
      };
      const user = await User.findById(decoded.id).select("role companies");

      if (!user) {
        return next(new Error("USER_NOT_FOUND"));
      }

      socket.data.userId = decoded.id;
      socket.data.role = user.role;
      socket.data.companies = (user.companies || []).map((c: any) =>
        typeof c === "string" ? c : c._id.toString(),
      );

      next();
    } catch (error) {
      next(new Error("AUTH_FAILED"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const { userId, role, companies } = socket.data;

    socket.join(`user:${userId}`);

    socket.on("ticket:join", (ticketId: string) => {
      socket.join(`ticket:${ticketId}`);
    });

    socket.on("ticket:leave", (ticketId: string) => {
      socket.leave(`ticket:${ticketId}`);
    });

    if (role === "admin") {
    socket.join("role:admin");
  } else if (role === "support") {
    socket.join("role:support");
    companies.forEach((companyId: string) => {
      socket.join(`company:${companyId}`);
    });
  } else if (role === "user") {
    companies.forEach((companyId: string) => {
      socket.join(`company:${companyId}`);
    });
  }

    socket.emit("socket:ready", { role, companies });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
