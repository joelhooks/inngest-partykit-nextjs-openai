import OpenAI from 'openai'
import { Message } from 'ai'
import { customAlphabet } from 'nanoid';
import { inngest } from '../../../inngest/inngest.server.client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7
);

export const runtime = 'edge'

export async function POST(req: Request) {
  // if no requestId is provided we generate one
  const { messages, requestId = nanoid() } = await req.json()
  console.log(requestId)

  await inngest.send({
    name: "api/chat.started",
    data: {
      messages: messages as Message[],
      requestId,
    },
  });

  return new Response(requestId as string, { status: 200 });
}