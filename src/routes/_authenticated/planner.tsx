import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ToolForm } from "@/components/tool-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "AI Task Planner — AI Workplace" }] }),
  component: PlannerPage,
});

function PlannerPage() {
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [context, setContext] = useState("");

  return (
    <div>
      <PageHeader
        title="AI Task Planner"
        description="Break a goal into prioritized tasks with estimates and suggested order."
      />
      <ToolForm
        kind="plan"
        buildPrompt={() => {
          if (!goal.trim()) return null;
          return {
            title: goal.slice(0, 80),
            input: { goal, deadline, context },
            prompt: `Goal: ${goal}
${deadline ? `Deadline: ${deadline}` : ""}
${context ? `Context / constraints: ${context}` : ""}

Build a complete task plan.`,
          };
        }}
        inputs={
          <>
            <div className="space-y-2">
              <Label>Goal</Label>
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Launch a customer feedback program"
              />
            </div>
            <div className="space-y-2">
              <Label>Deadline (optional)</Label>
              <Input
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="End of next quarter"
              />
            </div>
            <div className="space-y-2">
              <Label>Context / constraints (optional)</Label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Team size, budget, existing tools..."
                className="min-h-[120px]"
              />
            </div>
          </>
        }
      />
    </div>
  );
}
