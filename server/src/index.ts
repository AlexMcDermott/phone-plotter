import cors from "cors";
import express from "express";
import { createServer } from "https";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";

export type ServerToClientEvents = {
  sample: (sample: SocketData) => void;
  catchup: (samples: SocketData[]) => void;
};

export type ClientToServerEvents = {
  sample: (data: {
    acceleration: DeviceMotionEventAcceleration | null;
    rotationRate: DeviceMotionEventRotationRate | null;
    interval: number;
    timeStamp: number;
  }) => void;
};

type InterServerEvents = {};

export type Vec3 = [number, number, number];

export type SocketData = {
  time: number;
  data: {
    acceleration: Vec3;
    velocity: Vec3;
    position: Vec3;
  };
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

let samples: SocketData[] = [];

const logActiveConnections = async (io: Server<any>, ...args: any[]) => {
  const sockets = await io.fetchSockets();
  console.log(`active connections: ${sockets.length}`, ...args);
};

io.on("connection", async (socket) => {
  logActiveConnections(io, `(${socket.id} joined)`);

  socket.on("sample", (data) => {
    const time = data.timeStamp;
    let acceleration: Vec3 = [
      data.acceleration?.x || 0,
      data.acceleration?.y || 0,
      data.acceleration?.z || 0,
    ];
    let velocity: Vec3 = [0, 0, 0];
    let position: Vec3 = [0, 0, 0];

    const previousSample = samples.at(-1);
    if (previousSample) {
      const deltaT = (time - previousSample.time) / 1000;

      velocity = previousSample.data.velocity.map(
        (v, i) =>
          v +
          deltaT * ((previousSample.data.acceleration[i] + acceleration[i]) / 2)
      ) as Vec3;

      position = previousSample.data.position.map(
        (v, i) =>
          v + deltaT * ((previousSample.data.velocity[i] + velocity[i]) / 2)
      ) as Vec3;
    }

    const newSample: SocketData = {
      time,
      data: {
        acceleration,
        velocity,
        position,
      },
    };

    samples.push(newSample);
    io.emit("sample", newSample);
  });

  socket.on("disconnect", () => {
    samples = [];
    io.emit("catchup", samples);
    logActiveConnections(io, `(${socket.id} left)`);
  });
});

server.listen(8080, () => {
  console.log(`server up`);
});
