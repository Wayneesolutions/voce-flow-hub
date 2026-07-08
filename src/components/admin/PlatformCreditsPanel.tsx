import { useQuery } from "@tanstack/react-query";
import { Mic2, Zap, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { adminPlatformCreditsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const EL_LOW = 5000;
const VAPI_HIGH = 5;

export function PlatformCreditsPanel() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "platform-credits"],
    queryFn: adminPlatformCreditsApi.get,
    refetchInterval: 5 * 60 * 1000,
  });

  const el = data?.elevenlabs;
  const vapi = data?.vapi;

  const elPct =
    el && !el.error && el.charactersLimit > 0
      ? Math.min(100, Math.round((el.charactersRemaining / el.charactersLimit) * 100))
      : null;
  const elLow = el && !el.error && el.charactersRemaining < EL_LOW;
  const vapiHigh = vapi && !vapi.error && vapi.monthlySpend !== null && vapi.monthlySpend! > VAPI_HIGH;

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* ── ElevenLabs card ── */}
        <div
          className={cn(
            "rounded-lg border bg-card p-5",
            elLow ? "border-destructive/60" : "border-border",
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-md bg-violet-500/10 inline-flex items-center justify-center shrink-0">
                <Mic2 className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <div className="text-sm font-semibold">ElevenLabs</div>
                {el && !el.error && (
                  <div className="text-xs text-muted-foreground capitalize">{el.tier} plan</div>
                )}
              </div>
            </div>
            {isLoading ? null : elLow ? (
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            ) : el && !el.error ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : null}
          </div>

          {isLoading && <div className="text-xs text-muted-foreground">Loading...</div>}
          {el?.error && <div className="text-xs text-destructive">{el.error}</div>}

          {el && !el.error && (
            <>
              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Characters remaining</span>
                  <span className={cn(elLow && "text-destructive font-medium")}>{elPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      elLow ? "bg-destructive" : elPct! < 30 ? "bg-amber-500" : "bg-violet-500",
                    )}
                    style={{ width: `${elPct}%` }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Remaining</div>
                  <div
                    className={cn(
                      "font-semibold tabular-nums text-sm",
                      elLow ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {el.charactersRemaining.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Limit</div>
                  <div className="font-semibold tabular-nums text-sm">
                    {el.charactersLimit.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Used</div>
                  <div className="font-semibold tabular-nums text-sm">
                    {el.charactersUsed.toLocaleString()}
                  </div>
                </div>
                {el.resetDate && (
                  <div>
                    <div className="text-muted-foreground">Resets</div>
                    <div className="font-semibold text-sm">
                      {new Date(el.resetDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                )}
              </div>

              {elLow && (
                <div className="mt-3 rounded-md bg-destructive/10 text-destructive text-xs px-3 py-2">
                  Below {EL_LOW.toLocaleString()} chars — top up to avoid voice failures
                </div>
              )}
            </>
          )}
        </div>

        {/* ── VAPI card ── */}
        <div
          className={cn(
            "rounded-lg border bg-card p-5",
            vapiHigh ? "border-destructive/60" : "border-border",
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-md bg-blue-500/10 inline-flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <div className="text-sm font-semibold">VAPI</div>
                {vapi && !vapi.error && (
                  <div className="text-xs text-muted-foreground">{vapi.billingPeriod}</div>
                )}
              </div>
            </div>
            {isLoading ? null : vapiHigh ? (
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            ) : vapi && !vapi.error ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : null}
          </div>

          {isLoading && <div className="text-xs text-muted-foreground">Loading...</div>}
          {vapi?.error && <div className="text-xs text-destructive">{vapi.error}</div>}

          {vapi && !vapi.error && (
            <>
              <div className="mb-2">
                <div className="text-xs text-muted-foreground mb-1">Monthly spend</div>
                <div className={cn("text-2xl font-bold tabular-nums", vapiHigh ? "text-destructive" : "text-foreground")}>
                  {vapi.monthlySpend !== null ? `$${vapi.monthlySpend.toFixed(2)}` : "—"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mt-3">
                <div>
                  <div className="text-muted-foreground">Alert threshold</div>
                  <div className="font-semibold text-sm">${VAPI_HIGH}.00 / month</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div className={cn("font-semibold text-sm", vapiHigh ? "text-destructive" : "text-emerald-600")}>
                    {vapiHigh ? "Over limit" : "Within limit"}
                  </div>
                </div>
              </div>

              {vapiHigh && (
                <div className="mt-3 rounded-md bg-destructive/10 text-destructive text-xs px-3 py-2">
                  Spend exceeds ${VAPI_HIGH} — check VAPI dashboard for usage breakdown.
                </div>
              )}

              <div className="mt-3 text-[10px] text-muted-foreground/70 leading-relaxed">
                Aggregated from VAPI analytics. Reflects call costs for current billing period.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Last updated row */}
      {data?.fetchedAt && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
          <span>·</span>
          <span>Last updated {new Date(data.fetchedAt).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}
