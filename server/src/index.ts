import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

export type ServerToClientEvents = {
  message: (message: SocketData) => void;
  catchup: (messages: SocketData[]) => void;
};

export type ClientToServerEvents = {
  message: (message: Omit<SocketData, "timestamp">) => void;
};

type InterServerEvents = {};

export type SocketData = {
  timestamp: string;
  text: string;
  author: string;
};

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: true,
  },
});

const messages: SocketData[] = [];

const logActiveConnections = async (io: Server<any>, ...args: any[]) => {
  const sockets = await io.fetchSockets();
  console.log(`active connections: ${sockets.length}`, ...args);
};

io.on("connection", async (socket) => {
  logActiveConnections(io, `(${socket.id} joined)`);

  socket.emit("catchup", messages);

  socket.on("message", (data) => {
    console.log("got da msg:", data.text);
    const message: SocketData = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    messages.push(message);
    io.emit("message", message);
  });

  socket.on("disconnect", () => {
    logActiveConnections(io, `(${socket.id} left)`);
  });
});

server.listen(8080, () => {
  console.log("she up bb ⬆️");
});
