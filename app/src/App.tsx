import { edenTreaty } from "@elysiajs/eden";
import { EdenTreaty } from "@elysiajs/eden/treaty";
import QRCode from "qrcode";
import {
  ChangeEventHandler,
  FormEventHandler,
  useEffect,
  useRef,
  useState,
} from "react";
import { App, Message } from "../../server/src";

type Socket = ReturnType<EdenTreaty.Create<App>["ws"]["subscribe"]>;

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [qrCode, setQrCode] = useState<string>();

  const ws = useRef<Socket>();

  useEffect(() => {
    const onDeviceMotion = (event: DeviceMotionEvent) => {
      alert("motion");
      alert(JSON.stringify(event.acceleration));
      ws.current?.send({
        timestamp: Number(new Date()),
        text: JSON.stringify(event.acceleration),
        author: "client",
      });
    };

    window.addEventListener("devicemotion", onDeviceMotion);

    (async () => {
      const url = `http://${location.host}/`;
      setQrCode(await QRCode.toDataURL(url));
    })();

    const client = edenTreaty<App>(`${location.href}:8080`);

    console.log(location);
    ws.current = client.ws.subscribe();

    ws.current.on("error", (e) => console.log(e));

    ws.current?.subscribe(({ data: newMessage }) => {
      setMessages((oldMessages) => [...oldMessages, newMessage]);
    });

    return () => {
      if (ws.current?.ws.readyState === ws.current?.ws.OPEN) {
        ws.current?.close();
      }

      window.removeEventListener("devicemotion", onDeviceMotion);
    };
  }, []);

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setInput(e.target.value);
  };

  const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!input) return;

    ws.current?.send({
      timestamp: Number(new Date()),
      text: input,
      author: "client",
    });

    setInput("");
  };

  const onClick = async () => {
    try {
      DeviceOrientationEvent.requestPermission();
    } catch {
      console.log("yarn't on iOS son");
    }
  };

  return (
    <>
      <button onClick={onClick}>Start</button>

      <form onSubmit={onSubmit}>
        <input value={input} onChange={onChange} type="text" />
      </form>

      {messages.map(({ timestamp, text, author }) => (
        <div key={timestamp}>
          {author}: {text}
        </div>
      ))}

      {qrCode && <img src={qrCode}></img>}
    </>
  );
}

export default App;
