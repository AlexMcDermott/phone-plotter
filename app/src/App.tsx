import { Box } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import "chart.js/auto";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { Chart } from "react-chartjs-2";
import { Socket, io } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  Vec3,
} from "../../server/src";

const CERTIFICATE_URL = `${location.protocol}//${location.hostname}:8080/certificate.pem`;

function App() {
  const [samples, setSamples] = useState<SocketData[]>([]);
  const [qrCode, setQrCode] = useState<string>();

  const socket = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>();

  const onDeviceMotion = ({ acceleration }: DeviceMotionEvent) => {
    acceleration && socket.current?.emit("sample", acceleration);
  };

  const onClick = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (DeviceOrientationEvent as any).requestPermission?.();
  };

  useEffect(() => {
    (async () => {
      setQrCode(await QRCode.toDataURL(location.href));
    })();

    socket.current = io(`${location.hostname}:${8080}`);

    socket.current.on("catchup", (samples) => {
      setSamples(samples);
    });

    socket.current.on("sample", (newSample) => {
      setSamples((oldSamples) => [...oldSamples, newSample].slice(-100));
    });

    window.addEventListener("devicemotion", onDeviceMotion);

    return () => {
      socket.current?.close();
      window.removeEventListener("devicemotion", onDeviceMotion);
    };
  }, []);

  const pos = samples.at(-1)?.position.map((v) => v * 0.00001) as
    | Vec3
    | undefined;
  console.log(pos);

  return (
    <div className="flex min-h-screen items-center justify-center bg-red-300 p-2">
      {samples.length ? (
        <div className="flex h-full flex-grow flex-col items-center gap-2 bg-blue-400 *:flex-grow *:outline">
          <Canvas>
            <Box position={pos} material-color="hotpink" />
            <Box position={[1, 1, 1]} material-color="green" />
          </Canvas>

          <div className="w-full">
            <Chart
              type="line"
              title="Acceleration"
              options={{
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                  // y: { min: -20, max: 20 },
                  x: { ticks: { display: false } },
                },
              }}
              data={{
                labels: samples.map((sample) => sample.t),
                datasets: ["X", "Y", "Z"].map((label, i) => ({
                  label,
                  data: samples.map((v) => v.acceleration[i]),
                })),
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 *:outline">
          <button onClick={onClick}>
            Request device orientation permissions
          </button>

          <a download href={CERTIFICATE_URL}>
            Click to download server certificate
          </a>

          <img src={qrCode} className="w-min" />
        </div>
      )}
    </div>
  );
}

export default App;
