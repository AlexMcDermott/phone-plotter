import "chart.js/auto";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { Chart } from "react-chartjs-2";
import { Socket, io } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../../server/src";

function App() {
  const [messages, setMessages] = useState<SocketData[]>([]);
  const [qrCode, setQrCode] = useState<string>();

  const socket = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>();

  const onDeviceMotion = ({ acceleration }: DeviceMotionEvent) => {
    acceleration && socket.current?.emit("message", { acceleration });
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

    socket.current.on("catchup", (messages) => {
      setMessages(messages);
    });

    socket.current.on("message", (newMessage) => {
      setMessages((oldMessages) => [...oldMessages, newMessage].slice(-100));
    });

    window.addEventListener("devicemotion", onDeviceMotion);

    return () => {
      socket.current?.close();
      window.removeEventListener("devicemotion", onDeviceMotion);
    };
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      {messages.length ? (
        <Chart
          type="line"
          title="Acceleration"
          options={{ scales: { y: { min: -20, max: 20 } } }}
          data={{
            labels: messages.map((message) => message.t),
            datasets: [
              {
                label: "X",
                data: messages.map((message) => message.acceleration.x),
              },
              {
                label: "Y",
                data: messages.map((message) => message.acceleration.y),
              },
              {
                label: "Z",
                data: messages.map((message) => message.acceleration.z),
              },
            ],
          }}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 *:outline">
          <button onClick={onClick}>
            Request device orientation permissions
          </button>
          <a
            download
            href={`${location.protocol}//${location.hostname}:8080/certificate.pem`}
          >
            Click to download server certificate
          </a>
          <img src={qrCode} className="w-min" />
        </div>
      )}
    </div>
  );
}

export default App;
