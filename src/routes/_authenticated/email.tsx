import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ToolForm } from "@/components/tool-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({ meta: [{ title: "Smart Email Generator — AI Workplace" }] }),
  component: EmailPage,
});

const TONES = ["Professional", "Friendly", "Direct", "Formal", "Apologetic", "Persuasive"];

function EmailPage() {
  const [recipient, setRecipient] = useState("");
  const [tone, setTone] = useState("Professional");
  const [intent, setIntent] = useState("");
  const [context, setContext] = useState("");

  return (
    <div>
      <PageHeader
        title="Smart Email Generator"
        description="Draft professional emails with the tone and intent you choose."
      />
      <ToolForm
        kind="email"
        renderMarkdown={false}
        placeholderResult="Your draft email will appear here, ready to edit."
        buildPrompt={() => {
          if (!intent.trim()) return null;
          return {
            title: intent.slice(0, 80),
            input: { recipient, tone, intent, context },
            prompt: `Recipient: ${recipient || "[unspecified]"}
Tone: ${tone}
Intent: ${intent}
${context ? `Background context: ${context}` : ""}

Draft this email.`,
          };
        }}
        inputs={
          <>
            <div className="space-y-2">
              <Label>Recipient</Label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Hiring manager at Acme"
              />
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>What do you want to say?</Label>
              <Textarea
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="Follow up on yesterday's interview and reiterate interest in the role..."
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Background context (optional)</Label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Any relevant history, names, dates..."
                className="min-h-[80px]"
              />
            </div>
          </>
        }
      />
    </div>
  );
}
