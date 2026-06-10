import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "@/lib/ai-gateway.server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Body = { messages?: UIMessage[]; threadId?: string };

const SYSTEM = `You are AI Workplace Assistant — a helpful, concise productivity assistant for professionals. Use markdown for formatting. Be specific and actionable. When users ask for emails, plans, summaries, or research, structure your output clearly with headings and bullet points. If you're unsure, say so.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const { messages, threadId } = body;
        if (!Array.isArray(messages) || !threadId) {
          return new Response("messages and threadId required", { status: 400 });
        }

        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice(7);

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: claims } = await supabase.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (!userId) return new Response("Unauthorized", { status: 401 });

        // Verify thread ownership
        const { data: thread } = await supabase
          .from("chat_threads")
          .select("id, title")
          .eq("id", threadId)
          .eq("user_id", userId)
          .maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("AI gateway not configured", { status: 500 });

        const provider = createLovableAiGatewayProvider(key);
        const lastUser = messages[messages.length - 1];

        const result = streamText({
          model: provider(DEFAULT_MODEL),
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            try {
              // Save the last user message and the new assistant message
              const assistant = finalMessages[finalMessages.length - 1];
              const rows: Array<{
                thread_id: string;
                user_id: string;
                role: "user" | "assistant";
                parts: unknown;
              }> = [];
              if (lastUser?.role === "user") {
                rows.push({
                  thread_id: threadId,
                  user_id: userId,
                  role: "user",
                  parts: lastUser.parts as unknown,
                });
              }
              if (assistant?.role === "assistant") {
                rows.push({
                  thread_id: threadId,
                  user_id: userId,
                  role: "assistant",
                  parts: assistant.parts as unknown,
                });
              }
              if (rows.length) await supabase.from("chat_messages").insert(rows);

              // Auto-title from first user message
              if (thread.title === "New chat" && lastUser?.role === "user") {
                const text = (lastUser.parts as Array<{ type: string; text?: string }>)
                  .filter((p) => p.type === "text")
                  .map((p) => p.text ?? "")
                  .join(" ")
                  .slice(0, 60)
                  .trim();
                if (text) {
                  await supabase
                    .from("chat_threads")
                    .update({ title: text })
                    .eq("id", threadId);
                }
              } else {
                // bump updated_at
                await supabase
                  .from("chat_threads")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", threadId);
              }
            } catch (e) {
              console.error("Failed to persist chat", e);
            }
          },
        });
      },
    },
  },
});
