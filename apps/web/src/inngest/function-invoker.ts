import type { ChatCompletionRequestMessage, OpenAIApi } from "openai-edge";
import type { AIMessage, AIOutput, Functions, ProgressWriter } from "@/types";
import { isFunctionCall } from "@/lib/is-function-call";
import { formatFunctions } from "@/lib/format-functions";
import { parseFunctionCall } from "@/lib/parse-function-call";
import { WriteStrategyManyRequests, publish } from "./message-writer";
import { CONFIRM, DONE } from "@/lib/enums";

/**
 * The invoker dynamically creates steps to call OpenAI and functions.
 * 
 * 😅 There's a fair bit of complexity below, but it's mostly to handle
 * the various edge cases of calling OpenAI and functions.
 */
export class FunctionInvoker {
    #ai: OpenAIApi;
    #fns: Functions;
    #messages: AIMessage[];
    #requestId: string;
    #writer: ProgressWriter;

    constructor({
                    openai,
                    functions,
                    requestId,
                }: {
        openai: OpenAIApi;
        functions: Functions;
        requestId: string;
    }) {
        this.#ai = openai;
        this.#fns = functions;
        this.#requestId = requestId;
        this.#messages = [];
        this.#writer = new WriteStrategyManyRequests(requestId);
    }

    /**
     * This returns messages as input for ChatGPT
     *
     */
    get input() {
        return this.#messages.map((m) => {
            const input: ChatCompletionRequestMessage = {
                role: m.role,
                content: m.content,
            };
            if (m.name) {
                input.name = m.name;
            }
            if (m.function_call) {
                input.function_call = m.function_call;
            }
            return input;
        })
    }

    /**
     * Start runs the chain and should be called from your Inngest function.
     */
    async start(messages: AIMessage[], step: any): Promise<AIMessage[]> {
        this.#messages = messages || [];

        // Call OpenAI reliably, proxying the content to the browser.
        const output = await step.run(
            "Call OpenAI",
            async (): Promise<AIOutput> => {
                const resp = await this.#ai.createChatCompletion({
                    model: process.env.OPENAI_MODEL_NAME!,
                    stream: true,
                    messages: this.input,
                    functions: formatFunctions(this.#fns),
                });
                return this.#handleResponse(resp);
            }
        );

        this.#messages.push(output as AIMessage);
        while (isFunctionCall(this.#messages)) {
            // Continue to run the chain autonomously.
            await this.invoke(step);
        }
        return this.#messages;
    }

    /**
     * Invoke runs the chain, continually invoking OpenAI and functions
     * correctly.
     */
    async invoke(step: any): Promise<AIMessage[]> {
        if (!isFunctionCall(this.#messages)) {
            return this.#messages;
        }

        // Invoke the fn
        const call = parseFunctionCall(
            this.#messages[this.#messages.length - 1]
        ) ;

        // If this function requires confirmation, wait for the user to confirm.
        if (this.#fns[call.name]?.confirm) {
            // Publish a confirm request, then wait for confirmation.
            await step.run("Publish confirmation", async () => {
                await publish(CONFIRM, this.#requestId);
            });

            const confirm = await step.waitForEvent(`api/chat.confirmed`, {
                timeout: "5m",
                match: "data.requestId",
            });

            if (!confirm || !confirm.data.confirm) {
                await step.run("Publish deny", async () => {
                    await publish("You haven't given me permission to call this function.  I'll ignore the last function call request", this.#requestId);
                    await publish(DONE, this.#requestId);
                });

                this.#messages.push({
                    role: "assistant",
                    content: "You haven't given me permission to call this function.  I'll ignore the last function call request",
                });
                return this.#messages;
            }
        }

        const content = await step.run(
            `Call function ${call.name}`,
            async (): Promise<any> => {
                return this.#fns[call.name].invoke(call, this.#messages);
            }
        );

        const stringified = JSON.stringify(content);
        this.#messages.push({
            role: "function",
            name: call.name,
            content: stringified,
        });

        // Call the LLM one more time with the function output.
        const output = await step.run(
            "Call OpenAI",
            async (): Promise<AIOutput> => {
                const resp = await this.#ai.createChatCompletion({
                    model: process.env.OPENAI_MODEL_NAME!,
                    stream: true,
                    messages: this.input,
                    functions: formatFunctions(this.#fns),
                });
                return this.#handleResponse(resp);
            }
        );

        this.#messages.push(output as AIMessage);
        return this.#messages;
    }

    /**
     * This processes a response from OpenAI.
     */
    async #handleResponse(response: Response): Promise<AIOutput> {
        let result;

        if (response.status >= 400) {
            result = await response.json();
            throw new Error(
                result?.error?.message ?  result.error.message as string : "There was an error with openAI",
                {
                    cause: result,
                }
            );
        }

        try {
            result = await this.#writer.write(response);
        } catch (e) {
            console.warn((e as Error).message, e);
        } finally {
            await publish(DONE, this.#requestId);
        }
        return result as AIOutput;
    }

}