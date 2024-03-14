import React, {
  ChangeEventHandler,
  FormEvent,
  FormEventHandler,
  useState,
} from "react";

type Message = {
  timestamp: Date;
  text: string;
  author: string;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setInput(e.target.value);
  };

  const onSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!input) return;

    const newMessage: Message = {
      timestamp: new Date(),
      text: input,
      author: "client",
    };

    setMessages([...messages, newMessage]);
    setInput("");
  };

  return (
    <>
      <form onSubmit={onSubmit}>
        <input value={input} onChange={onChange} />
      </form>

      {messages.map(({ timestamp, text, author }) => (
        <div key={Number(timestamp)}>
          {author}: {text}
        </div>
      ))}
    </>
  );
}

export default App;
