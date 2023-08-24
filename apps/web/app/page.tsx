import { Button, Header } from "ui";
import { Party } from "./message-button";
import Chat from "./chat-box";

export default function Page(): JSX.Element {
  return (
    <>
      <Header text="Web" />
      <Button />
      <Party />
      <Chat />
    </>
  );
}
