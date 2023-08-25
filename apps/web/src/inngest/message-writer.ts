import { OpenAIStream, StreamingTextResponse } from "ai";
import type { AIMessage, AIOutput } from "@/types";

export class WriteStrategyManyRequests {
  requestId: string;

  interval = 250;

  buffer: {
    contents: string;
    // signal is a blocking signal which resolves when the buffer has been written.
    signal?: Promise<unknown>;
  };

  constructor(requestId: string) {
    this.requestId = requestId;
    this.buffer = {
      contents: "",
    };
  }

  async write(resp: Response): Promise<AIOutput> {
    const applyChunk = this.chunk.bind(this);

    const pipe = new TransformStream({
      async transform(chunk, controller) {
        // When we receive a chunk, publish this as a new request.
        const text = new TextDecoder().decode(chunk);
        await applyChunk(text);
        // await publish(text, requestId);
        // Continue with the standard stream.
        controller.enqueue(chunk);
      },
    });
    // Publish via our writing pipe.
    const stream = OpenAIStream(resp).pipeThrough(pipe);
    const result = await parse(stream, this.requestId);
    await this.buffer.signal;
    return result;
  }

  async chunk(text: string) {
    let resolve = (_val?: any) => {};

    this.buffer.contents += text;

    if (this.buffer.signal) {
      // Already enqueued.
      return;
    }

    (this.buffer.signal = new Promise((r) => {
      resolve = r;
    }))
    setTimeout(() => {
      if (this.buffer.contents.length === 0) {
        // No need to write
        resolve();
        return;
      }
      publish(this.buffer.contents, this.requestId);
      resolve();
      this.buffer = {
        contents: "",
      };
    }, this.interval);
  }
}


/**
 * 🥳 Publish a message to the party. Sends a POST request to the partykit server.
 * The server then broadcasts it to all connected clients.
 *
 * @param body
 * @param requestId
 */
export const publish = async (body: string, requestId: string) => {
  const partyUrl = `${process.env.NEXT_PUBLIC_PARTY_KIT_URL!}/party/${process.env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}`
  await fetch(partyUrl, {
    method: "POST",
    body: JSON.stringify({
        requestId,
        body,
    }),
  }).catch((e) => {
    console.error(e);
  })
};

const parse = async (
  stream: ReadableStream,
  requestId: string
): Promise<AIOutput> => {
  // And then pass this through the standard text response
  const text = await new StreamingTextResponse(stream).text();
  try {
    const raw = JSON.parse(text) as Record<string, any>;
    const output = {
      role: "assistant",
      content: null,
      ...raw,
    } as unknown;
    return output as AIMessage;
  } catch (e) {
    // This may not be JSON
    return { role: "assistant", content: text };
  }
};