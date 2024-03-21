import "chart.js/auto";
import QRCode from "qrcode";
import {
  ChangeEventHandler,
  FormEventHandler,
  useEffect,
  useRef,
  useState,
} from "react";
import { Chart } from "react-chartjs-2";
import { Socket, io } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../../server/src";

function App() {
  const [messages, setMessages] = useState<SocketData[]>([]);
  const [input, setInput] = useState("");
  const [qrCode, setQrCode] = useState<string>();

  const socket = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>();

  const onDeviceMotion = ({ acceleration }: DeviceMotionEvent) => {
    acceleration &&
      socket.current?.emit("message", {
        data: { acceleration },
      });
  };

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setInput(e.target.value);
  };

  const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!input) return;

    setInput("");
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
      setMessages((oldMessages) => [...oldMessages, newMessage]);
    });

    window.addEventListener("devicemotion", onDeviceMotion);

    return () => {
      socket.current?.close();
      window.removeEventListener("devicemotion", onDeviceMotion);
    };
  }, []);

  return (
    <div className="flex flex-col mx-auto gap-2 h-screen justify-center w-fit *:outline bg-blue-500 ">
      <button onClick={onClick}>Request Device Orientation Permissions</button>

      <a
        download
        href={`${location.protocol}//${location.hostname}:8080/certificate.pem`}
      >
        Click to Server Certificate
      </a>

      <form onSubmit={onSubmit}>
        <input value={input} onChange={onChange} type="text" />
      </form>

      {/* {messages.map(({ t, data }) => {
        return <div key={t}>{data}</div>;
      })} */}

      <Chart
        type="line"
        data={{
          labels: messages.map((message) => message.t),
          datasets: [
            {
              label: "My First Dataset",
              data: messages.map((message) => message.data.acceleration.x),
              fill: false,
              borderColor: "rgb(75, 192, 192)",
              tension: 0.1,
            },
          ],
        }}
      />

      {qrCode && <img src={qrCode} className="w-1/2"></img>}
    </div>
  );
}

export default App;
