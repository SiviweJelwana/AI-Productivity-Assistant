import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
      <div className="px-6 py-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function AiDisclaimer() {
  return (
    <p className="text-xs text-muted-foreground border border-dashed border-border rounded-md px-3 py-2 bg-muted/30">
      ⚠️ AI-generated content may be inaccurate or biased. Review and edit before sending or
      acting on it. Don't share confidential information you wouldn't put in a third-party tool.
    </p>
  );
}
