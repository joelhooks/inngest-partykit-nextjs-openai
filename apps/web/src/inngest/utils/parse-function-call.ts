import type {ChatCompletionRequestMessage} from "openai-edge";
import type { AIMessage, FunctionCall } from "../types";

export const parseFunctionCall = (o: AIMessage): FunctionCall => {
    if (!!(o as ChatCompletionRequestMessage).function_call) {
        const fn = o as ChatCompletionRequestMessage;
        return {
            name: fn.function_call?.name || "",
            arguments: JSON.parse(fn.function_call?.arguments || "{}"),
        };
    }
    throw new Error("no function call available");
};
