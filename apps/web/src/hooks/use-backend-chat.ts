import { useId, useRef, useEffect, useState, useCallback } from "react";
import { customAlphabet } from "nanoid";
import type { UseChatOptions } from "ai/react";
import type {
  ChatRequestOptions,
  CreateMessage,
  Message,

} from "ai";
import usePartySocket from "partysocket/react";


export function useBackendChat({
  id,
  initialMessages = [],
  initialInput = "",
}: UseChatOptions = {}) {
  // Generate a unique id for the chat if not provided
  const requestId = useRef<string>(nanoid()).current;
  const chatId = id || requestId;

  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConfirmRequired, setIsConfirmRequired] = useState<boolean>(false);

  // Keep a mutable buffer of incoming messages
  const [tokenBuffer, setTokenBuffer] = useState<string[]>([]);

  // Keep the latest messages in a ref.
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Abort controller to cancel the current API call.
  //
  // TODO: Send cancellation event.
  const abortControllerRef = useRef<AbortController | null>(null);

  const mutate = useCallback(
    async (currentMessages?: Message[]) => {
      setIsLoading(true);
      await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: currentMessages || messages,
          requestId,
        }),
      });
    },
    [messages, requestId]
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const append = useCallback(
    async (message: Message | CreateMessage) => {
      if (!message.id) {
        message.id = nanoid();
      }
      if (!message.createdAt) {
        message.createdAt = new Date();
      }
      const history = messages.concat([message]);
      setMessages(history);
      await mutate(history);
    },
    [messages]
  );

  usePartySocket({
    room: "my-room",
    host: process.env.NEXT_PUBLIC_PARTY_KIT_URL!,
    onMessage: (message) => {
      setLastMessage(message);
    }
  });

  console.log('requestId', requestId)

  // State to update chat UI
  useEffect(() => {
    if (lastMessage?.data === `\\confirm`) {
      setIsLoading(false);
      setIsConfirmRequired(true);
      return;
    }

    if (lastMessage?.data === `\\ok`) {
      setIsLoading(false);
      if (tokenBuffer.length === 0) {
        return;
      }

      // If the first tokenBuffer contains "function_call", parse this entire
      // item as a function call.
      let history = messages;
      if (tokenBuffer[0].includes("function_call")) {
        const call = JSON.parse(tokenBuffer.join(""));
        history = messages.concat([
          {
            role: "assistant",
            content: null,
            function_call: call?.function_call || call,
            createdAt: new Date(),
          },
        ]);
      } else {
        history = messages.concat([
          {
            role: "assistant",
            content: tokenBuffer.join(""),
            createdAt: new Date(),
          },
        ]);
      }

      // This is the end of our token stream.
      setTokenBuffer([]);
      setMessages(history);
      return;
    }

    if (lastMessage !== null) {
      setTokenBuffer(tokenBuffer.concat([lastMessage.data]));
    }
  }, [lastMessage]);

  const handleInputChange = (e: any) => {
    setInput(e.target.value);
  };

  // Input state and handlers.
  const [input, setInput] = useState(initialInput);

  const handleSubmit = useCallback(
    (
      e: React.FormEvent<HTMLFormElement>,
      { options, functions, function_call }: ChatRequestOptions = {},
      metadata?: Object
    ) => {
      e.preventDefault();
      if (!input) return;

      append({
        content: input,
        role: "user",
        createdAt: new Date(),
      });
      setInput("");
    },
    [input, append]
  );

  const onConfirm = useCallback(
    async (ok: boolean) => {
      setIsLoading(true);
      setIsConfirmRequired(false);
      await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          requestId: requestId,
          confirm: ok,
        }),
      });
    },
    []
  );

  return {
    messages,
    buffer: tokenBuffer.join(""),
    requestId,
    isConfirmRequired,
    onConfirm,
    // error,
    append,
    // reload,
    stop,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
  };
}

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7
);
