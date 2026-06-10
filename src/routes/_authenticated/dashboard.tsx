import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Mail, FileText, ListTodo, Search, MessagesSquare, ArrowRight } from "lucide-react";
import { PageHeader, AiDisclaimer } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AI Workplace" }] }),
  component: Dashboard,
});

const TOOLS = [
  {
    to: "/email" as const,
    title: "Smart Email Generator",
    description: "Draft professional emails in seconds with the tone and intent you choose.",
    icon: Mail,
  },
  {
    to: "/summary" as const,
    title: "Meeting Notes Summarizer",
    description: "Turn raw notes or transcripts into clean summaries, decisions, and action items.",
    icon: FileText,
  },
  {
    to: "/planner" as const,
    title: "AI Task Planner",
    description: "Break a goal into prioritized tasks with estimates and a suggested order.",
    icon: ListTodo,
  },
  {
    to: "/research" as const,
    title: "AI Research Assistant",
    description: "Get a structured briefing on any topic with key points and follow-up questions.",
    icon: Search,
  },
  {
    to: "/chat" as const,
    title: "AI Chatbot",
    description: "An open-ended assistant for anything else — saved across conversations.",
    icon: MessagesSquare,
  },
];

function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Workspace"
        description="Pick a tool to automate part of your workday."
      />
      <div className="p-6 space-y-6 max-w-6xl">
        <AiDisclaimer />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link key={tool.to} to={tool.to}>
              <Card className="p-5 h-full bg-card hover:bg-accent/40 hover:border-primary/40 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                    <tool.icon className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-semibold mb-1">{tool.title}</h3>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
