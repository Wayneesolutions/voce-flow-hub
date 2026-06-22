import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Phone } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { sentimentApi, type ActiveCall } from '@/lib/api'

export const Route = createFileRoute('/portal/live-calls')({
  head: () => ({ meta: [{ title: 'Live Calls · Portal' }] }),
  component: LiveCallsPage,
})

// ── Sentiment display config ──────────────────────────────────────────────────

type Sentiment = ActiveCall['sentiment']
type Intent    = ActiveCall['intent']

const SENTIMENT_STYLE: Record<Sentiment, { label: string; cls: string }> = {
  VERY_POSITIVE: { label: 'Very positive', cls: 'bg-success/10 text-success' },
  POSITIVE:      { label: 'Positive',      cls: 'bg-success/10 text-success' },
  NEUTRAL:       { label: 'Neutral',       cls: 'bg-muted text-muted-foreground' },
  NEGATIVE:      { label: 'Negative',      cls: 'bg-warning/10 text-warning' },
  VERY_NEGATIVE: { label: 'Very negative', cls: 'bg-destructive/10 text-destructive' },
  UNKNOWN:       { label: 'No data yet',   cls: 'bg-muted text-muted-foreground' },
}

const INTENT_STYLE: Record<Intent, { label: string; cls: string }> = {
  HOT:     { label: '🔥 Hot',     cls: 'bg-destructive/10 text-destructive' },
  WARM:    { label: '☀️ Warm',    cls: 'bg-warning/10 text-warning' },
  COLD:    { label: '❄️ Cold',    cls: 'bg-accent/10 text-accent' },
  UNKNOWN: { label: 'Unknown',    cls: 'bg-muted text-muted-foreground' },
}

const ACTION_LABEL: Record<string, string> = {
  KEEP_GOING:       '✅ Keep going',
  PUSH_FOR_MEETING: '📅 Push for meeting',
  SLOW_DOWN:        '⚠️ Slow down',
  END_CALL:         '🔴 Suggest ending call',
}

// ── Live duration timer ───────────────────────────────────────────────────────

const STALE_AFTER_SECONDS = 12 * 60 // 12 min — if a call runs this long with no data it's almost certainly a zombie

function useDuration(startedAt: string | null) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!startedAt) return
    const start = new Date(startedAt).getTime()
    const tick = () => setSecs(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return { display: `${m}:${String(s).padStart(2, '0')}`, isStale: secs > STALE_AFTER_SECONDS }
}

// ── Call card ─────────────────────────────────────────────────────────────────

function CallCard({ call }: { call: ActiveCall }) {
  const { display: duration, isStale } = useDuration(call.startedAt)
  const sent     = SENTIMENT_STYLE[call.sentiment]
  const intent   = INTENT_STYLE[call.intent]
  const action   = call.suggestedAction ? ACTION_LABEL[call.suggestedAction] : null

  return (
    <div className={`rounded-lg border bg-card p-5 flex flex-col gap-3 ${isStale ? 'border-warning/40 opacity-60' : 'border-border'}`}>
      {/* Header: name + live badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{call.lead.name}</p>
          {call.lead.company && (
            <p className="text-xs text-muted-foreground truncate">{call.lead.company}</p>
          )}
        </div>
        {isStale ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 text-warning text-[11px] font-medium px-2.5 py-1 shrink-0">
            ⚠ May have ended
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success text-[11px] font-medium px-2.5 py-1 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            LIVE {duration}
          </span>
        )}
      </div>

      {/* Campaign */}
      {call.campaign && (
        <p className="text-xs text-muted-foreground">📋 {call.campaign}</p>
      )}

      {/* Stale explanation */}
      {isStale && (
        <p className="text-xs text-warning/80 italic">
          Call has been running {duration} — the end report may not have arrived yet. It will clear automatically.
        </p>
      )}

      {/* Sentiment + Intent — only show when AI has reported data */}
      {!isStale && call.sentiment === 'UNKNOWN' ? (
        <p className="text-xs text-muted-foreground italic">Waiting for AI sentiment data...</p>
      ) : !isStale && (
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${sent.cls}`}>
            {sent.label}
          </span>
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${intent.cls}`}>
            {intent.label}
          </span>
        </div>
      )}

      {/* Suggested action */}
      {action && (
        <p className="text-xs font-medium text-muted-foreground">{action}</p>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function LiveCallsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['portal-live-calls'],
    queryFn:  sentimentApi.active,
    refetchInterval: 5000,
  })

  const calls = data?.activeCalls ?? []

  return (
    <DashboardShell
      sidebar={null}
      title="Live Calls"
      subtitle="Your active calls in real time — updates every 5 seconds"
    >
      {/* Active count pill */}
      <div className="mb-5">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
          calls.length > 0
            ? 'bg-success/10 text-success'
            : 'bg-muted text-muted-foreground'
        }`}>
          <span className={`h-2 w-2 rounded-full ${calls.length > 0 ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
          {calls.length} active call{calls.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Loading */}
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">
          Could not load live call data. Try refreshing the page.
        </p>
      )}

      {/* Empty state */}
      {!isLoading && !error && calls.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
          <Phone className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No active calls right now</p>
          <p className="text-xs text-muted-foreground mt-1">
            This page updates automatically when your campaign starts calling
          </p>
        </div>
      )}

      {/* Call cards grid */}
      {calls.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {calls.map((call) => (
            <CallCard key={call.callId} call={call} />
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
