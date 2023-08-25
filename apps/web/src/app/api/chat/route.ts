import type { Message } from 'ai'
import { customAlphabet } from 'nanoid';
import { inngest } from '@/inngest/inngest.server.client';

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7
);

export const runtime = 'edge'

export async function POST(req: Request) {
  // if no requestId is provided we generate one
  const body = await req.json()
  const { messages, requestId = nanoid(), confirm } = body

  if (confirm !== undefined) {
    // Confirm API
    await inngest.send({
      name: "api/chat.confirmed",
      data: {
        requestId,
        confirm,
      },
    });
    return new Response(requestId, { status: 200 });
  }

  console.log('start the chat')

  await inngest.send({
    name: "api/chat.started",
    data: {
      messages: messages as Message[],
      requestId,
    },
  });

  return new Response(requestId as string, { status: 200 });
}