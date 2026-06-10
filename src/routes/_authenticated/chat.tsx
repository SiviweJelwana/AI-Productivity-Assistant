import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listThreads, createThread, deleteThread } from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "AI Chat — AI Workplace" }] }),
  component: ChatLayout,
});

function ChatLayout() {
  const listFn = useServerFn(listThreads);
  const createFn = useServerFn(createThread);
  const deleteFn = useServerFn(deleteThread);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: threads = [] } = useQuery({
    queryKey: ["threads"],
    queryFn: () => listFn({}),
  });

  const createMutation = useMutation({
    mutationFn: () => createFn({}),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { threadId: id } }),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      if (pathname.includes(id)) navigate({ to: "/chat" });
    },
  });

  return (
    <div className="flex h-full">
      <aside className="w-72 border-r border-border bg-card/30 flex flex-col">
        <div className="p-3 border-b border-border">
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="w-full"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" /> New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {threads.length === 0 && (
            <p className="p-4 text-xs text-muted-foreground text-center">No chats yet.</p>
          )}
          {threads.map((t) => {
            const active = pathname.includes(t.id);
            return (
              <div
                key={t.id}
                className={cn(
                  "group flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors",
                  active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                )}
              >
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: t.id }}
                  className="flex-1 min-w-0 flex items-center gap-2"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{t.title}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                </Link>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this chat?")) deleteMutation.mutate(t.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
