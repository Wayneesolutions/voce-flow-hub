import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { costsApi } from "@/lib/api";
import {
  Wallet, TrendingDown, PhoneCall, Receipt, CalendarCheck, Loader2,
  Server, Mic2, Brain, AudioWaveform, Globe2,
} from "lucide-react";

export const Route = createFileRoute("/portal/costs")({
  head: () => ({ meta: [{ title: "Cost · Client Portal" }] }),
  component: PortalCosts,
});

const VENDOR_ROWS: {
  key: "telephony" | "vapi" | "stt" | "llm" | "tts";
  label: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  { key: "telephony", label: "Telephony (Twilio/Plivo)", hint: "the actual phone line", icon: <Globe2 className="h-4 w-4" /> },
  { key: "vapi", label: "Vapi", hint: "call orchestration", icon: <Server className="h-4 w-4" /> },
  { key: "stt", label: "Deepgram", hint: "speech-to-text", icon: <Mic2 className="h-4 w-4" /> },
  { key: "llm", label: "OpenAI", hint: "the AI's brain", icon: <Brain className="h-4 w-4" /> },
  { key: "tts", label: "ElevenLabs / Cartesia", hint: "the AI's voice", icon: <AudioWaveform className="h-4 w-4" /> },
];

function PortalCosts() {
  const { data: costs, isLoading } = useQuery({
    queryKey: ["portal-costs"],
    queryFn: () => costsApi.get(),
  });

  const fmt = (n: number | null | undefined) => `$${(n ?? 0).toFixed(2)}`;
  const maxVendor = costs
    ? Math.max(...VENDOR_ROWS.map((v) => costs.byVendor[v.key]), 0.01)
    : 0.01;
  const maxCountry = costs?.byCountry?.length
    ? Math.max(...costs.byCountry.map((c) => c.cost), 0.01)
    : 0.01;

  return (
    <DashboardShell
      sidebar={null}
      title="Cost"
      subtitle="What you're actually paying across Twilio, Plivo, Vapi, Deepgram, OpenAI and ElevenLabs — separate from what clients are billed"
    >
      {isLoading ? (
        <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total real cost"
              value={fmt(costs?.totalCost)}
              icon={<Wallet className="h-4 w-4" />}
              hint="this period"
            />
            <StatCard
              label="Gross margin"
              value={fmt(costs?.grossMargin)}
              icon={<TrendingDown className="h-4 w-4" />}
              hint={`billed ${fmt(costs?.totalBilled)}`}
            />
            <StatCard
              label="Cost per call"
              value={fmt(costs?.costPerCall)}
              icon={<PhoneCall className="h-4 w-4" />}
              hint={`${costs?.totalCalls ?? 0} calls`}
            />
            <StatCard
              label="Cost per booked meeting"
              value={costs?.costPerBookedMeeting != null ? fmt(costs.costPerBookedMeeting) : "—"}
              icon={<CalendarCheck className="h-4 w-4" />}
              hint={`${costs?.bookedMeetings ?? 0} booked`}
            />
          </div>

          {costs && (
            <p className="mt-3 text-xs text-muted-foreground">
              Period: {new Date(costs.period.from).toLocaleDateString()} –{" "}
              {new Date(costs.period.to).toLocaleDateString()}
            </p>
          )}

          {/* Cost by vendor */}
          <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Cost by product
            </div>
            <div className="p-5 space-y-4">
              {VENDOR_ROWS.map((v) => {
                const value = costs?.byVendor[v.key] ?? 0;
                const pct = costs?.totalCost ? Math.round((value / costs.totalCost) * 100) : 0;
                return (
                  <div key={v.key}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="text-muted-foreground">{v.icon}</span>
                        {v.label}
                        <span className="text-xs text-muted-foreground font-normal">— {v.hint}</span>
                      </span>
                      <span className="tabular-nums font-medium">
                        {fmt(value)} <span className="text-muted-foreground font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, (value / maxVendor) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost by country */}
          <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border font-semibold flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-muted-foreground" />
              Cost by country
            </div>
            {!costs?.byCountry?.length ? (
              <div className="p-6 text-sm text-muted-foreground">No cost data for this period yet.</div>
            ) : (
              <div className="p-5 space-y-4">
                {costs.byCountry.map((c) => (
                  <div key={c.country}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{c.country}</span>
                      <span className="tabular-nums font-medium">
                        {fmt(c.cost)} <span className="text-muted-foreground font-normal">· {c.calls} calls</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Math.min(100, (c.cost / maxCountry) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Telephony cost is the real per-number rate set in Admin → Phone Numbers. Vapi/Deepgram/OpenAI/ElevenLabs
            rates are configured platform-wide and apply the same regardless of destination country. These are
            estimates based on connected call duration, not live vendor invoices — reconcile against actual
            Twilio/Plivo/Vapi/ElevenLabs billing periodically for precision.
          </p>
        </>
      )}
    </DashboardShell>
  );
}
