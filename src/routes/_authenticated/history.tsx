import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAiOutputs, deleteAiOutput, updateAiOutput } from "@/lib/ai-tools.functions";
import { PageHeader, AiDisclaimer } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Copy, Save, Mail, FileText, ListTodo, Search as SearchIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Saved Outputs — AI Workplace" }] }),
  component: HistoryPage,
});

const KIND_META = {
  email: { label: "Emails", icon: Mail },
  summary: { label: "Summaries", icon: FileText },
  plan: { label: "Plans", icon: ListTodo },
  research: { label: "Research", icon: SearchIcon },
} as const;

type Kind = keyof typeof KIND_META | "all";

function HistoryPage() {
  const listFn = useServerFn(listAiOutputs);
  const deleteFn = useServerFn(deleteAiOutput);
  const updateFn = useServerFn(updateAiOutput);
  const qc = useQueryClient();

  const [filter, setFilter] = useState<Kind>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState("");

  const { data: outputs = [] } = useQuery({
    queryKey: ["outputs", filter],
    queryFn: () => listFn({ data: filter === "all" ? {} : { kind: filter } }),
  });

  const selected = outputs.find((o) => o.id === selectedId) ?? outputs[0];
  const currentContent = selected?.id === selectedId ? editing : selected?.content ?? "";

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outputs"] });
      setSelectedId(null);
      toast.success("Deleted");
    },
  });

  async function handleSave() {
    if (!selected) return;
    try {
      await updateFn({ data: { id: selected.id, content: currentContent } });
      qc.invalidateQueries({ queryKey: ["outputs"] });
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div>
      <PageHeader title="Saved Outputs" description="Your generated drafts, summaries, plans, and research." />
      <div className="p-6 space-y-4 max-w-7xl">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Kind)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {(Object.keys(KIND_META) as Array<keyof typeof KIND_META>).map((k) => (
              <TabsTrigger key={k} value={k}>
                {KIND_META[k].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card className="p-2 bg-card max-h-[70vh] overflow-y-auto">
            {outputs.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">
                Nothing saved yet. Generate something from one of the tools.
              </p>
            ) : (
              <ul className="space-y-1">
                {outputs.map((o) => {
                  const Icon = KIND_META[o.kind as keyof typeof KIND_META].icon;
                  const isActive = (selected?.id ?? null) === o.id;
                  return (
                    <li key={o.id}>
                      <button
                        onClick={() => {
                          setSelectedId(o.id);
                          setEditing(o.content);
                        }}
                        className={`w-full text-left p-3 rounded-md text-sm flex items-start gap-2 transition-colors ${
                          isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                        }`}
                      >
                        <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{o.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(o.updated_at), { addSuffix: true })}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {selected ? (
            <Card className="p-5 bg-card space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold truncate">{selected.title}</h2>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(currentContent);
                      toast.success("Copied");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleSave}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(selected.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={selected.id === selectedId ? editing : selected.content}
                onChange={(e) => {
                  setSelectedId(selected.id);
                  setEditing(e.target.value);
                }}
                className="min-h-[300px] font-mono text-sm bg-background"
              />
              <div className="border-t border-border pt-3">
                <div className="text-xs text-muted-foreground mb-2">Preview</div>
                <div className="prose-chat text-sm">
                  <ReactMarkdown>{currentContent}</ReactMarkdown>
                </div>
              </div>
              <AiDisclaimer />
            </Card>
          ) : (
            <Card className="p-12 bg-card text-center text-muted-foreground text-sm">
              Select an item to view and edit.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
