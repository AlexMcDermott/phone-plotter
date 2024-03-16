import { Elysia, Static, t } from "elysia";

const messageScheme = t.Object({
  timestamp: t.Number(),
  text: t.String(),
  author: t.String(),
});

export type Message = Static<typeof messageScheme>;

const app = new Elysia()
  .ws("/ws", {
    body: messageScheme,
    response: messageScheme,
    message: (ws, message) => {
      ws.send(message);
      ws.send({
        timestamp: Number(Date.now()),
        text: message.text.toLocaleUpperCase(),
        author: "server",
      });
    },
    open: (ws) => {
      console.log(`client connected: ${ws.id}`);
    },
    close: (ws) => {
      console.log(`client disconnected: ${ws.id}`);
    },
  })
  .listen(8080);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
