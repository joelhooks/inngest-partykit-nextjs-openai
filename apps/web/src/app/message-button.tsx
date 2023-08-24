"use client";

import * as React from 'react'
import usePartySocket from 'partysocket/react'

export function Party() : JSX.Element {
  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTY_KIT_URL!,
    room: 'my-room',
    onOpen(e) {
      console.log(e)
    },
    onMessage(event: MessageEvent<string>) {
      console.log(event.data)
    },
    onClose(e) {
      console.log(e)
    }
  });
  
  return (
    <button onClick={() : void => {
      socket.send(`hello ${String(Math.random())}`) // where is my message? 😭
    }} type='button'>
      party!
    </button>
  )
}