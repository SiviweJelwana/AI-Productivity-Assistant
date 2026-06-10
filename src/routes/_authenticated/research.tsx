import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ToolForm } from "@/components/tool-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({ meta: [{ title: "AI Research Assistant — AI Workplace" }] }),
  component: ResearchPage,
});

function ResearchPage() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [questions, setQuestions] = useState("");

  return (
    <div>
      <PageHeader
        title="AI Research Assistant"
        description="Get a structured briefing on any topic with key points and follow-up questions."
      />
      <ToolForm
        kind="research"
        buildPrompt={() => {
          if (!topic.trim()) return null;
          return {
            title: topic.slice(0, 80),
            input: { topic, audience, questions },
            prompt: `Topic: ${topic}
${audience ? `Audience: ${audience}` : ""}
${questions ? `Specific questions to address:\n${questions}` : ""}

Produce a structured research briefing.`,
          };
        }}
        inputs={
          <>
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Vector databases for RAG applications"
              />
            </div>
            <div className="space-y-2">
              <Label>Audience (optional)</Label>
              <Input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Technical product manager"
              />
            </div>
            <div className="space-y-2">
              <Label>Specific questions (optional)</Label>
              <Textarea
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                placeholder="What are the main trade-offs?&#10;When should we choose X over Y?"
                className="min-h-[120px]"
              />
            </div>
          </>
        }
      />
    </div>
  );
}
