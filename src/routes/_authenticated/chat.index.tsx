import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createThread } from "@/lib/chat.functions";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MessagesSquare, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const createFn = useServerFn(createThread);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const m = useMutation({
    mutationFn: () => createFn({}),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
    },
  });

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4">
      <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
        <MessagesSquare className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">AI Chatbot</h2>
        <p className="text-sm text-muted-foreground max-w-md mt-1">
          An open-ended assistant for anything else. Conversations are saved across sessions.
        </p>
      </div>
      <Button onClick={() => m.mutate()} disabled={m.isPending}>
        <Plus className="mr-2 h-4 w-4" /> Start a new chat
      </Button>
    </div>
  );
}
