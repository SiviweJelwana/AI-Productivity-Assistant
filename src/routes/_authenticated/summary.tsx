import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ToolForm } from "@/components/tool-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/summary")({
  head: () => ({ meta: [{ title: "Meeting Notes Summarizer — AI Workplace" }] }),
  component: SummaryPage,
});

function SummaryPage() {
  const [meetingName, setMeetingName] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div>
      <PageHeader
        title="Meeting Notes Summarizer"
        description="Turn raw notes or transcripts into a clean summary with decisions and action items."
      />
      <ToolForm
        kind="summary"
        buildPrompt={() => {
          if (!notes.trim()) return null;
          return {
            title: meetingName || "Meeting summary",
            input: { meetingName },
            prompt: `Meeting: ${meetingName || "Untitled"}

Raw notes / transcript:
${notes}`,
          };
        }}
        inputs={
          <>
            <div className="space-y-2">
              <Label>Meeting name</Label>
              <Input
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
                placeholder="Q3 planning sync"
              />
            </div>
            <div className="space-y-2">
              <Label>Raw notes or transcript</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste meeting notes or a transcript here..."
                className="min-h-[280px] font-mono text-sm"
              />
            </div>
          </>
        }
      />
    </div>
  );
}
