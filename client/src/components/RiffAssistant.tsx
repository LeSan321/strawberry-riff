/**
 * RiffAssistant — floating creative collaborator panel
 *
 * Architecture: soul.md v0.2
 * - Floating button (bottom-right), opens a slide-in drawer
 * - Page context passed to server on every message
 * - Conversation history maintained in local state (up to 50 turns)
 * - Markdown rendering via streamdown
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RiffAssistantProps {
  pageContext?: string;
}

// Strawberry icon as SVG
function StrawberryIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 3C9 3 6 5 5 8C4 11 5 14 7 16C9 18 11 21 12 21C13 21 15 18 17 16C19 14 20 11 19 8C18 5 15 3 12 3Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M12 3C12 3 11 1 9 1C9 1 10 3 12 3Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M12 3C12 3 13 1 15 1C15 1 14 3 12 3Z"
        fill="currentColor"
        opacity="0.7"
      />
      <circle cx="10" cy="10" r="0.8" fill="white" opacity="0.5" />
      <circle cx="13" cy="12" r="0.8" fill="white" opacity="0.5" />
      <circle cx="11" cy="14" r="0.8" fill="white" opacity="0.5" />
      <circle cx="14" cy="9" r="0.6" fill="white" opacity="0.4" />
      <circle cx="9" cy="13" r="0.6" fill="white" opacity="0.4" />
    </svg>
  );
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hey — I'm the Riff. I'm here for your music: lyrics, generation prompts, platform questions, whatever you're working on. What's on your mind?",
};

export function RiffAssistant({ pageContext = "general" }: RiffAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chatMutation = trpc.assistant.chat.useMutation();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isThinking) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsThinking(true);

    try {
      const result = await chatMutation.mutateAsync({
        messages: updatedMessages.slice(-50), // keep last 50 turns
        pageContext,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.reply },
      ]);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ??
        "Something went wrong. Try again in a moment.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `_(${message})_`,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking, messages, pageContext, chatMutation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([WELCOME_MESSAGE]);
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? "bg-pink-600 scale-95"
            : "bg-gradient-to-br from-pink-500 to-rose-600 hover:scale-110 hover:shadow-pink-500/40"
        }`}
        aria-label="Open Riff Assistant"
        title="Riff Assistant"
      >
        {isOpen ? (
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <StrawberryIcon className="w-7 h-7 text-white" />
        )}
      </button>

      {/* Slide-in drawer */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-zinc-950/98 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-2.5">
              <StrawberryIcon className="w-5 h-5 text-pink-400" />
              <span className="text-sm font-semibold text-white">
                The Riff
              </span>
              <span className="text-xs text-zinc-500 font-normal">
                · your creative collaborator
              </span>
            </div>
            <button
              onClick={clearConversation}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              title="Clear conversation"
            >
              clear
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 max-h-96" ref={scrollRef as React.RefObject<HTMLDivElement>}>
            <div className="px-4 py-3 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center mr-2 mt-0.5">
                      <StrawberryIcon className="w-3.5 h-3.5 text-pink-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-pink-600/90 text-white rounded-br-sm"
                        : "bg-white/6 text-zinc-200 rounded-bl-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Thinking indicator */}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center mr-2 mt-0.5">
                    <StrawberryIcon className="w-3.5 h-3.5 text-pink-400" />
                  </div>
                  <div className="bg-white/6 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-pink-400/60 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-pink-400/60 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-pink-400/60 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="px-3 py-3 border-t border-white/8">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your music…"
                className="flex-1 min-h-[40px] max-h-32 resize-none bg-white/5 border-white/10 text-white placeholder:text-zinc-600 text-sm rounded-xl focus:border-pink-500/50 focus:ring-0 py-2.5 px-3"
                rows={1}
                disabled={isThinking}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isThinking}
                size="sm"
                className="bg-pink-600 hover:bg-pink-500 text-white rounded-xl h-10 w-10 p-0 flex-shrink-0 disabled:opacity-40"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19V5m0 0l-7 7m7-7l7 7"
                  />
                </svg>
              </Button>
            </div>
            <p className="text-[10px] text-zinc-700 mt-1.5 px-1">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
