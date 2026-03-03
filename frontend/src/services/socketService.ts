import { io, Socket } from "socket.io-client";

type SocketEventCallback<T = any> = (data: T) => void;

let socket: Socket | null = null;
const listeners: Map<string, Set<SocketEventCallback>> = new Map();

const bindAllListeners = () => {
  listeners.forEach((callbacks, event) => {
    callbacks.forEach((cb) => {
      socket?.off(event, cb);
      socket?.on(event, cb);
    });
  });
};

export const socketService = {
  connect: () => {
    if (socket?.connected) return socket;

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }

    socket = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      bindAllListeners();
    });

    socket.on("socket:ready", () => {});

    socket.on("disconnect", () => {});

    socket.on("connect_error", () => {});

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    listeners.clear();
  },

  getSocket: () => socket,

  on: <T>(event: string, callback: SocketEventCallback<T>) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(callback as SocketEventCallback);
    if (socket?.connected) {
      socket.on(event, callback);
    }
  },

  off: (event: string, callback?: SocketEventCallback) => {
    if (callback) {
      listeners.get(event)?.delete(callback);
      socket?.off(event, callback);
    } else {
      listeners.delete(event);
      socket?.off(event);
    }
  },
};
