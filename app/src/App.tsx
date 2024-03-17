import QRCode from "qrcode";
import {
  ChangeEventHandler,
  FormEventHandler,
  useEffect,
  useRef,
  useState,
} from "react";
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

  useEffect(() => {
    // const onDeviceMotion = (event: DeviceMotionEvent) => {
    //   alert("motion");
    //   alert(JSON.stringify(event.acceleration));
    //   ws.current?.send({
    //     timestamp: Number(new Date()),
    //     text: JSON.stringify(event.acceleration),
    //     author: "client",
    //   });
    // };

    // window.addEventListener("devicemotion", onDeviceMotion);

    (async () => {
      const url = `http://${location.host}/`;
      setQrCode(await QRCode.toDataURL(url));
    })();

    socket.current = io(`${location.hostname}:${8080}`);

    socket.current.on("catchup", (messages) => {
      setMessages(messages);
    });

    socket.current.on("message", (newMessage) => {
      setMessages((oldMessages) => [...oldMessages, newMessage]);
    });

    return () => {
      socket.current?.close();

      // window.removeEventListener("devicemotion", onDeviceMotion);
    };
  }, []);

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setInput(e.target.value);
  };

  const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!input) return;

    socket.current?.emit("message", {
      text: input,
      author: "client",
    });

    setInput("");
  };

  // const onClick = async () => {
  //   try {
  //     DeviceOrientationEvent.requestPermission();
  //   } catch {
  //     console.log("yarn't on iOS son");
  //   }
  // };

  return (
    <>
      {/* <button onClick={onClick}>Start</button> */}

      <form onSubmit={onSubmit}>
        <input value={input} onChange={onChange} type="text" />
      </form>

      {messages.map(({ timestamp, text, author }) => {
        return (
          <div key={timestamp}>
            {author}: {text}
          </div>
        );
      })}

      {qrCode && <img src={qrCode}></img>}
    </>
  );
}

export default App;
