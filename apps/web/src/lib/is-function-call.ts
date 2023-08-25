import type { AIMessage } from "../types";

export const isFunctionCall = (o: AIMessage[]): boolean => {
    const last = o[o.length - 1];
    return !!(last as AIMessage)?.function_call?.name;
};