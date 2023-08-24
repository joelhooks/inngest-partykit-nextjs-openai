'use client'
import * as React from 'react'
import { useChat } from 'ai/react'
import usePartySocket from "partysocket/react";

export default function Chat() {
  const { input, handleInputChange, handleSubmit } = useChat()
    const [messages, setMessages] = React.useState<string[]>([])
    usePartySocket({
        host: process.env.NEXT_PUBLIC_PARTY_KIT_URL!,
        room: 'my-room',
        onMessage(event: MessageEvent<string>) {
            setMessages([...messages, event.data])
        }
    });

  return (
    <div>
      {messages.map(m => (
        <div key={m}>
          {m}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  )
}