import {
    type ChatCompletionRequestMessage,
    Configuration,
    OpenAIApi,
} from "openai-edge"
import {inngest} from "./inngest.server.client";
import type { AIMessage, FunctionCall, Functions } from "@/types";
import { FunctionInvoker } from "./function-invoker";
import { LinearClient } from "@linear/sdk";

const config = new Configuration({apiKey: process.env.OPENAI_API_KEY})
const openai = new OpenAIApi(config)
const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });

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
    {event: "api/chat.started"},
    async ({event, step}) => {
        const invoker = new FunctionInvoker({
            openai,
            functions,
            requestId: event.data.requestId,
            });

        const messages = await invoker.start(event.data.messages as AIMessage[], step);
        return messages;
    }
);


// All available functions for Linear.
const functions: Functions = {
  search_issues: {
    docs: {
      name: "search_issues",
      description: "Search all issues for the given text",
      parameters: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description: "The search term",
          },
        },
        required: ["search"],
      },
    },
    invoke: async (f: FunctionCall, _m: ChatCompletionRequestMessage[]) => {
      if (typeof f.arguments.search !== "string") {
        throw new Error("No search term provided");
      }
      return linear.issues({
        last: 5,
        filter: { searchableContent: { contains: f.arguments.search } },
      });
    },
  },
  delete_issue: {
    docs: {
      name: "delete_issue",
      description: "Delete an issue by ID",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID of the issue to delete",
          },
        },
        required: ["id"],
      },
    },
    confirm: true,
    invoke: async (f: FunctionCall, _m: ChatCompletionRequestMessage[]) => {
      console.log("🤡 Not actually deleting issues!", f.arguments.id);
      return true;
    },
  },
};

