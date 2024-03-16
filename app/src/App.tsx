import { edenTreaty } from "@elysiajs/eden";
import { EdenTreaty } from "@elysiajs/eden/treaty";
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

  const ws = useRef<Socket>();

  useEffect(() => {
    const client = edenTreaty<App>("http://localhost:8080");
    ws.current = client.ws.subscribe();

    ws.current?.subscribe(({ data: newMessage }) => {
      console.log("got msg", newMessage);
      setMessages((oldMessages) => [...oldMessages, newMessage]);
    });

    return () => {
      if (ws.current?.ws.readyState === ws.current?.ws.OPEN) {
        ws.current?.close();
      }
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

  return (
    <>
      <form onSubmit={onSubmit}>
        <input value={input} onChange={onChange} />
      </form>

      {messages.map(({ timestamp, text, author }) => (
        <div key={timestamp}>
          {author}: {text}
        </div>
      ))}
    </>
  );
}

export default App;
