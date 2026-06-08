import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, delta, hint, icon }: Props) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {typeof delta === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium",
              up ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {up ? "+" : ""}{delta}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
