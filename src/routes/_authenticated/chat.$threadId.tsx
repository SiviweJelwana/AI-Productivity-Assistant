import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getThreadMessages } from "@/lib/chat.functions";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AiDisclaimer } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThread,
});

function ChatThread() {
  const { threadId } = Route.useParams();
  const getMessages = useServerFn(getThreadMessages);

  const { data: initial, isLoading } = useQuery({
    queryKey: ["chat-messages", threadId],
    queryFn: () => getMessages({ data: { threadId } }),
  });

  if (isLoading || !initial) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <ChatWindow key={threadId} threadId={threadId} initial={initial as UIMessage[]} />;
}

function ChatWindow({ threadId, initial }: { threadId: string; initial: UIMessage[] }) {
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
        fetch: async (url, init) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          const headers = new Headers(init?.headers);
          if (token) headers.set("Authorization", `Bearer ${token}`);
          return fetch(url, { ...init, headers });
        },
      }),
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initial,
    transport,
  });

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, status]);

  const busy = status === "submitted" || status === "streaming";

  async function submit() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  }

  return (
    <div className="h-full flex flex-col">
      <div ref={scrollerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-semibold">How can I help?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ask me anything about work — drafting, planning, summarizing, researching.
              </p>
            </div>
          )}
          {messages.map((m) => {
            const text = m.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("");
            return (
              <div key={m.id} className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {m.role === "user" ? "You" : "Assistant"}
                </div>
                {m.role === "user" ? (
                  <div className="inline-block max-w-full bg-primary text-primary-foreground rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm whitespace-pre-wrap">
                    {text}
                  </div>
                ) : (
                  <div className="prose-chat text-sm text-foreground">
                    <ReactMarkdown>{text}</ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })}
          {status === "submitted" && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background/80 backdrop-blur">
        <div className="max-w-3xl mx-auto p-4 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex gap-2 items-end"
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask anything..."
              className="resize-none min-h-[52px] max-h-40 bg-card"
              disabled={busy}
            />
            <Button type="submit" disabled={busy || !input.trim()} size="icon" className="h-[52px] w-[52px] shrink-0">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <AiDisclaimer />
        </div>
      </div>
    </div>
  );
}
