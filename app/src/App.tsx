import { Box, OrbitControls, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import "chart.js/auto";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { Chart } from "react-chartjs-2";
import { Socket, io } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../../server/src";

const CERTIFICATE_URL = `${location.protocol}//${location.hostname}:8080/certificate.pem`;

function App() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [samples, setSamples] = useState<SocketData[]>([]);
  const [qrCode, setQrCode] = useState<string>();

  const socket = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>();

  const onDeviceMotion = useCallback(
    ({
      acceleration,
      rotationRate,
      interval,
      timeStamp,
    }: DeviceMotionEvent) => {
      if (!isStreaming) return;
      socket.current?.emit("sample", {
        acceleration,
        rotationRate,
        interval,
        timeStamp,
      });
    },
    [isStreaming],
  );

  const requestOrientationPermission = () => {
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
  }, [onDeviceMotion]);

  return (
    <div className="flex h-dvh items-center justify-center p-2">
      {samples.length ? (
        <div className="flex h-full grow flex-col gap-2 *:outline">
          <Canvas camera={{ position: [10, 10, 10] }}>
            <Box
              position={samples.at(-1)?.data.position}
              material-color="green"
            />
            <OrbitControls target={[0, 0, 0]} />
            <gridHelper />
            <axesHelper args={[10]} />
            <Stats />
          </Canvas>

          <div>
            <Chart
              type="line"
              options={{
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                  // y: { min: -20, max: 20 },
                  x: { ticks: { display: false } },
                },
              }}
              data={{
                labels: samples.map((sample) => sample.time),
                datasets: ["X", "Y", "Z"].map((label, i) => ({
                  label,
                  data: samples.map((v) => v.data.position[i]),
                })),
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 *:outline">
          <button onClick={requestOrientationPermission}>
            Request device orientation permissions
          </button>

          <a download href={CERTIFICATE_URL}>
            Click to download server certificate
          </a>

          <button onClick={() => setIsStreaming(true)}>Start streaming</button>

          <img src={qrCode} className="w-min" />
        </div>
      )}
    </div>
  );
}

export default App;
