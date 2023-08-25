"use client";
import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import { useBackendChat } from '@/hooks/use-backend-chat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loading } from "@/components/icons";
import type {CreateMessage, Message} from "ai";

export default function Chat() {
  const formRef = React.useRef<HTMLFormElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const {input, setInput, handleSubmit, isLoading, messages, buffer, isConfirmRequired, onConfirm} = useBackendChat()
  const disabled = input.length === 0 || isLoading;

  React.useEffect(() => {
    window.scrollTo({
      top: window.innerHeight*2,
      behavior: "smooth"
    });
  }, [buffer]);
  return (
<main className="min-h-screen flex-col md:flex pb-[200px]   bg-gradient-to-b from-transparent via-gray-50 to-gray-50 ">
      <div className="flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16 border-b px-6 border-slate-200">
        <h2 className="text-lg font-semibold">InngestAI</h2>

        <div className="ml-auto flex space-x-2 sm:justify-end">
          <div className="hidden space-x-2 md:flex"></div>
        </div>
      </div>

      <div className="py-8">
        <div className="max-w-2xl px-4 mx-auto prose">
          <div className="px-8 pb-4 border rounded-lg bg-background shadow-md">
            <h2 className="font-semibold font-xl mb-6 text-gray-800">
              Welcome to Inngest + Vercel AI!
            </h2>
            <p className="text-gray-500">
              An open-source framework that calls OpenAI functions in the
              background securely, with everything handled for you:
            </p>
            <ul className="mt-4 list-disc ml-4 text-gray-500">
              <li>Function state automatically managed</li>
              <li>Automatic retries</li>
              <li>Audit trails and logging</li>
              <li>Auto-cancellation on navigation change</li>
              <li>Background to browser streaming</li>
              <li>User confirmations built in</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-sm sm:px-8 md:px-0 max-w-screen-md w-full mx-auto flex flex-col items-stretch shadow-sm">
        {messages.filter((m) => m.role !== 'system').map((m) => (
          <MessageUI message={m} key={m.id || m.content} />
        ))}
        <BufferUI buffer={buffer} />
        {isConfirmRequired && <ConfirmUI onConfirm={onConfirm} />}
      </div>
        {isLoading && (
        <div className="text-sm sm:px-8 md:px-0 max-w-screen-md w-full mx-auto flex flex-col items-stretch my-4">
          <div>
            <Loading className="mx-auto text-neutral-300" />
          </div>
        </div>
        )}

      <div className="fixed bottom-0 flex w-full flex-col items-center space-y-3 from-transparent via-gray-100 to-gray-100 p-5 pb-16 sm:px-0">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="relative w-full max-w-screen-md rounded-xl border border-slate-300 bg-white shadow-xl mx-6 focus:outline-none"
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                formRef.current?.requestSubmit();
                e.preventDefault();
              }
            }}
            spellCheck={false}
            className="border-0 w-full focus:outline-none p-4 pr-12 resize-none text-base rounded-xl flex min-h-[40px] focus:outline-0"
            placeholder="Send a message"
            rows={1}
            disabled={isLoading}
          />
          <button
            className={`absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-md transition-all ${
              disabled
                ? "cursor-not-allowed bg-white text-slate-400"
                : "text-green-500 hover:bg-green-600"
            }`}
            disabled={disabled}
          >
            {isLoading ? <Loading /> : <Send />}
          </button>
        </form>
        <small className="text-slate-500">
          Open source AI chatbot built with{" "}
          <a href="https://www.inngest.com" className="font-bold">
            Inngest
          </a>{" "}
          and{" "}
          <a href="https://www.vercel.com" className="font-bold">
            Vercel
          </a>
        </small>
      </div>
    </main>
  )
}


const MessageUI = ({ message, planning = false }: { message: Message | CreateMessage, planning?: boolean }) => {
  let classes = "";
  switch (message.role) {
    case "system" || "assistant":
      classes = "border-neutral-400 border-l-[3px] text-neutral-900 bg-neutral-100";
      break;
    default:
      classes = "border-blue-300 border-l-[3px] text-neutral-900 bg-white py-6";
      break;
  }

  if (message.function_call) {
    return <CallUI message={message} />
  }

  return (
    <div
      className={`
        px-6 pt-4 pb-5
        ${classes}
      `}
    >
      <p className="text-stone-300 mt-[-3px] text-sm mb-[1px]">
        <small>
          {message.role === "user" ? "You" : "AI"} {message.createdAt && ` · ${message.createdAt?.toLocaleString()}` }
        </small>
      </p>
      <ReactMarkdown children={message.content} className="prose" />
    </div>
  );
};

const CallUI = ({ message, planning = false }: { message: Message | CreateMessage, planning?: boolean }) => {
  const call = message.function_call === "string" ? JSON.parse(message.function_call) : message.function_call;
  return (
    <div
      className={`
        py-8 px-6
        border-neutral-300
        bg-neutral-50
        border-l-[3px]
        border-b border-b-[0.5px]
        text-sm
        `
      }
    >
      <pre className="text-xs">
        <p className="font-bold mb-1 text-emerald-600">Function call</p>
        <p className="text-neutral-800">{call?.name}{!planning && <span className="text-neutral-500">({call.arguments})</span>}</p>
        </pre>
      </div>
    );
}

const ConfirmUI = ({ onConfirm } : {onConfirm: (ok:boolean) => void}) => {
  React.useEffect(() => {
    window.scrollTo({
      top: window.innerHeight*2,
      behavior: "smooth"
    });
  }, []);

  return (
    <div
      className={`
        py-8 px-6
        border-neutral-300
        bg-neutral-50
        border-l-[3px]
        border-b border-b-[0.5px]
        w-full
        `
      }
    >
      <div className="prose">
        <h4 className="text-amber-700">Are you sure you want to call this function?</h4>
        <p className="text-neutral-500">This function requires confirmation before being invoked.</p>
      </div>

      <div className="flex justify-center mt-6">
        <Button
          className="bg-indigo-500 shadow-lg shadow-indigo-500/50 mr-8 px-6"
          onClick={() => onConfirm(true)}
        >
          Yes
        </Button>
        <Button
          className="border border-red-400 hover:bg-neutral-50 bg-neutral-50 mr-8 px-6 text-red-600 hover:shadow-xl"
          onClick={() => onConfirm(false)}
        >
          No
        </Button>
      </div>
    </div>
    );
}


const BufferUI = ({ buffer }: { buffer: string }) => {
  if (!buffer || buffer.length === 0) {
    return null;
  }

  if (buffer.indexOf("{") === 0) {
    let call = {
      name: "Planning function...",
      arguments: ''
    };
    try { call = JSON.parse(buffer) } catch(e) {};
    return (
      <CallUI
        planning={call.name === "Planning function..."}
        message={{
          id: "buffer",
          role: "assistant",
          content: "",
          function_call: call,
        }}
      />
    )
  }

  return (
    <MessageUI
      planning
      message={{
        id: "buffer",
        role: "assistant",
        content: buffer,
      }}
    />
  )
};
