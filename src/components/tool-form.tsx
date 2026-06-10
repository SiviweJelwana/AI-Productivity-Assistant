import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateAiOutput, updateAiOutput } from "@/lib/ai-tools.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Save, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { AiDisclaimer } from "@/components/page-header";

type Kind = "email" | "summary" | "plan" | "research";

export function ToolForm({
  kind,
  inputs,
  buildPrompt,
  buildTitle,
  resultLabel = "Result",
  renderMarkdown = true,
  placeholderResult,
}: {
  kind: Kind;
  inputs: React.ReactNode;
  buildPrompt: () => { prompt: string; title: string; input: Record<string, unknown> } | null;
  buildTitle?: () => string;
  resultLabel?: string;
  renderMarkdown?: boolean;
  placeholderResult?: string;
}) {
  const qc = useQueryClient();
  const generateFn = useServerFn(generateAiOutput);
  const updateFn = useServerFn(updateAiOutput);

  const [output, setOutput] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const built = buildPrompt();
      if (!built) throw new Error("Please fill in the required fields");
      return generateFn({
        data: { kind, title: built.title, prompt: built.prompt, input: built.input },
      });
    },
    onSuccess: (row) => {
      setOutput(row.content);
      setSavedId(row.id);
      qc.invalidateQueries({ queryKey: ["outputs"] });
      toast.success("Generated and saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });

  async function handleSave() {
    if (!savedId) return;
    try {
      await updateFn({ data: { id: savedId, content: output } });
      qc.invalidateQueries({ queryKey: ["outputs"] });
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(output);
    toast.success("Copied");
  }

  return (
    <div className="p-6 grid gap-6 lg:grid-cols-2 max-w-7xl">
      <Card className="p-5 space-y-4 bg-card">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Input
        </h2>
        {inputs}
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Generate
            </>
          )}
        </Button>
        <AiDisclaimer />
      </Card>

      <Card className="p-5 space-y-3 bg-card flex flex-col">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            {resultLabel}
          </h2>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={handleCopy} disabled={!output}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleSave} disabled={!savedId}>
              <Save className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {output ? (
          <>
            <Textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="min-h-[400px] font-mono text-sm bg-background"
            />
            {renderMarkdown && (
              <div className="border-t border-border pt-3">
                <div className="text-xs text-muted-foreground mb-2">Preview</div>
                <div className="prose-chat text-sm">
                  <ReactMarkdown>{output}</ReactMarkdown>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-md min-h-[400px]">
            {placeholderResult ?? "Your generated result will appear here."}
          </div>
        )}
      </Card>
    </div>
  );
}
