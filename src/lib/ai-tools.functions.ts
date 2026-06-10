import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GenerateSchema = z.object({
  kind: z.enum(["email", "summary", "plan", "research"]),
  title: z.string().min(1).max(200),
  prompt: z.string().min(1).max(20000),
  input: z.record(z.string(), z.unknown()).optional(),
});

export const generateAiOutput = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => GenerateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway not configured");

    const { createLovableAiGatewayProvider, DEFAULT_MODEL } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");

    const systemPrompts: Record<typeof data.kind, string> = {
      email:
        "You are an expert professional writing assistant. Generate clear, polite, well-structured business emails. Respect the requested tone. Output the email as: Subject line on the first line prefixed with 'Subject: ', a blank line, then the body. No markdown wrapper, no explanations.",
      summary:
        "You are a meeting notes specialist. Produce a clean summary with these markdown sections: ## Summary (3-5 bullets), ## Key Decisions, ## Action Items (with owner if mentioned, otherwise '— '). Be faithful to the source.",
      plan:
        "You are a productivity coach. Break the user's goal into an ordered task plan as markdown. Include: ## Plan (numbered tasks with [P0/P1/P2] priority and ~estimated time), then ## Suggested order, then ## Risks.",
      research:
        "You are a research analyst. Produce a structured briefing: ## Overview, ## Key Points (5-8 bullets), ## Considerations / Trade-offs, ## Follow-up questions. Be neutral and concrete. Flag uncertainty explicitly.",
    };

    const provider = createLovableAiGatewayProvider(key);
    const result = await generateText({
      model: provider(DEFAULT_MODEL),
      system: systemPrompts[data.kind],
      prompt: data.prompt,
    });

    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("generated_outputs")
      .insert({
        user_id: userId,
        kind: data.kind,
        title: data.title,
        input: (data.input ?? {}) as never,
        content: result.text,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

const UpdateSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(0).max(50000),
  title: z.string().min(1).max(200).optional(),
});

export const updateAiOutput = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => UpdateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("generated_outputs")
      .update({ content: data.content, ...(data.title ? { title: data.title } : {}) })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ListSchema = z.object({
  kind: z.enum(["email", "summary", "plan", "research"]).optional(),
});

export const listAiOutputs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ListSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("generated_outputs")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows;
  });

export const deleteAiOutput = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("generated_outputs")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
