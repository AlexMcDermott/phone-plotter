import cors from "cors";
import express from "express";
import { createServer } from "https";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";

export type ServerToClientEvents = {
  message: (message: SocketData) => void;
  catchup: (messages: SocketData[]) => void;
};

export type ClientToServerEvents = {
  message: (message: Omit<SocketData, "t">) => void;
};

type InterServerEvents = {};

export type SocketData = {
  t: number;
  acceleration: DeviceMotionEventAcceleration;
};

const app = express();
app.use(cors());

const keyPath = path.join(__dirname, "../certs/localhost-key.pem");
const certPath = path.join(__dirname, "../certs/localhost.pem");

const key = fs.readFileSync(keyPath);
const cert = fs.readFileSync(certPath);

app.get("/certificate.pem", (_req, res) => {
  res.download(certPath);
});

const server = createServer({ key, cert }, app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, { cors: { origin: true } });

const history: SocketData[] = [];

const logActiveConnections = async (io: Server<any>, ...args: any[]) => {
  const sockets = await io.fetchSockets();
  console.log(`active connections: ${sockets.length}`, ...args);
};

io.on("connection", async (socket) => {
  logActiveConnections(io, `(${socket.id} joined)`);

  // socket.emit("catchup", history);

  socket.on("message", (data) => {
    const message: SocketData = {
      ...data,
      t: performance.now(),
    };

    history.push(message);
    io.emit("message", message);
  });

  socket.on("disconnect", () => {
    logActiveConnections(io, `(${socket.id} left)`);
  });
});

server.listen(8080, () => {
  console.log(`server up`);
});
