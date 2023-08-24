import { inngest } from "./inngest.server.client";

import {
  ChatCompletionRequestMessage,
  Configuration,
  OpenAIApi,
} from "openai-edge"
import { WriteStrategyManyRequests, publish } from "./write-many";

export const DONE = "\\ok";
export const CONFIRM = "\\confirm";

const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY })
const openai = new OpenAIApi(config)

async function handleResponse(response: Response): Promise<AIOutput> {

  let result;

    if (response.status >= 400) {
      const result = await response.json();
      throw new Error(
        result?.error?.message || "There was an error with openAI",
        {
          cause: result,
        }
      );
    }

    try {
      const writer = new WriteStrategyManyRequests('hi')
      result = await writer.write(response);
    } catch (e) {
      console.warn((e as Error).message, e);
    } finally {
      publish(DONE, 'hi');
    }
    return result as AIOutput;


  }

export type AIMessage = ChatCompletionRequestMessage & {
  content: null | string;
  createdAt?: Date;
  id?: string;
};

export type AIError = { error: string };

export type AIOutput = AIMessage | AIError;


export const aibot = inngest.createFunction(
  {
    name: "OpenAI Linear Bot",
    cancelOn: [
      // Cancel this function if we receive a cancellation event with the same request ID can .
      // This prevents wasted execution and increased costs.
      {
        event: "api/chat.cancelled",
        if: "event.data.requestId == async.data.requestId",
      },
    ],
  },
  { event: "api/chat.started" },
  async ({ event, step }) => {
    // const invoker = new Invoker({
    //   openai,
    //   functions,
    //   requestId: event.data.requestId,
    // });

     const output = await step.run(
      "Call OpenAI",
      async (): Promise<AIOutput> => {
        const resp = await openai.createChatCompletion({
          model: "gpt-3.5-turbo-0613",
          stream: true,
          messages: event.data.messages.map<ChatCompletionRequestMessage>((m) => {
            const input: ChatCompletionRequestMessage = {
              role: m.role,
              content: m.content,
            };
            if (m.name) {
              input.name = m.name;
            }
            return input;
          })
        });

        console.log(resp)
        return handleResponse(resp);
      }
    );

    console.log(output)
    // const messages = await invoker.start(event.data.messages, step);
    return output;
  }
);


