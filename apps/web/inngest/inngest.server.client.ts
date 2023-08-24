import { EventSchemas, Inngest } from "inngest";
import type { Message } from "ai";

export const inngest = new Inngest({
  name: "Inngest + PartyKit: OpenAI Function invocation app",
  schemas: new EventSchemas().fromRecord<Events>(),
});

type ChatStarted = {
  data: {
    requestId: string;
    messages: Message[];
  };
};

type ChatCancelled = {
  data: {
    requestId: string;
  };
};

type ChatConfirmed = {
  data: {
    requestId: string;
    confirm: boolean;
  };
};

type Events = {
  "api/chat.started": ChatStarted;
  "api/chat.cancelled": ChatCancelled;
  "api/chat.confirmed": ChatConfirmed;
};
