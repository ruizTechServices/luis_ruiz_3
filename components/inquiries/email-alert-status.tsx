"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type RecentAlert = { inquiry_id: number | null; kind: "inquiry" | "test"; state: string; attempts: number; last_error_code: string | null; accepted_at: string | null; next_attempt_at: string | null };
type AlertStatus = { configured: boolean; pending: number; accepted: number; attention: number; workerCheckedAt: string | null; missing: string[]; recent: RecentAlert[]; message?: string };

const ERROR_HELP: Record<string, string> = {
  not_configured: "Waiting for email setup",
  provider_credentials: "Check the email API key and verified sender",
  provider_rejected: "The provider rejected the email; check sender setup",
  provider_rate_limit: "Provider rate limit; retry scheduled",
  provider_retryable: "Temporary provider failure; retry scheduled",
  provider_unknown_result: "Acceptance is unclear; checking again safely",
  payload_conflict: "Provider request differs; review before resending",
  attempt_limit: "Retry limit reached; review before resending",
  idempotency_window: "Retry window ended; review before resending",
};

const STATE_LABELS: Record<string, string> = { pending: "Queued", processing: "Sending", not_configured: "Waiting for setup", sent: "Provider accepted", failed: "Send failed", needs_review: "Needs review" };

export function EmailAlertStatus() {
  const [status, setStatus] = useState<AlertStatus | null>(null);
  const [busy, setBusy] = useState<"status" | "test" | "retry" | null>("status");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/inquiries/alerts", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Alert status is unavailable.");
        setStatus(data);
      })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Alert status is unavailable."); })
      .finally(() => { if (!controller.signal.aborted) setBusy(null); });
    return () => controller.abort();
  }, []);

  async function run(action: "status" | "test" | "retry") {
    if (busy) return;
    setBusy(action); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/inquiries/alerts${action === "status" ? "" : `?action=${action}`}`, {
        method: action === "status" ? "GET" : "POST", cache: "no-store", signal: AbortSignal.timeout(60_000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "The alert action could not finish.");
      setStatus(data); setMessage(data.message ?? "Status refreshed.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Email alerts are unavailable. Your inquiries are still saved."); }
    finally { setBusy(null); }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6" aria-labelledby="email-alert-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h2 id="email-alert-heading" className="font-display text-xl">Email alerts</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Get a private inbox link when a new inquiry arrives. Client messages stay on your site. Alerts go only to your verified owner email.</p>
        </div>
        <Button type="button" variant="outline" disabled={busy !== null} onClick={() => run("status")}>{busy === "status" ? "Checking…" : "Refresh status"}</Button>
      </div>
      {status ? <>
        <p className="mt-4 text-sm font-medium">{status.configured ? "Email credentials are present. Send a test to check them." : "Setup required — inquiries are saved, but email alerts are not enabled."}</p>
        {status.configured ? <p className="mt-1 text-xs text-muted-foreground">{status.workerCheckedAt ? `Automatic worker last checked: ${new Date(status.workerCheckedAt).toLocaleString()}.` : "The automatic worker has not checked in yet. Alerts normally process every minute."}</p> : <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium">Connect email alerts</summary>
          <div className="mt-2 space-y-2 leading-relaxed text-muted-foreground">
            <p>Verify a sender domain in <a className="underline underline-offset-4" href="https://resend.com/domains" target="_blank" rel="noreferrer">Resend</a>, then add <code>RESEND_API_KEY</code> and <code>INQUIRY_ALERT_FROM</code> to this project’s <a className="underline underline-offset-4" href="https://supabase.com/dashboard/project/huyhgdsjpdjzokjwaspb/functions/secrets" target="_blank" rel="noreferrer">Supabase function secrets</a>. The sender must be an address allowed by your Resend account.</p>
            {status.missing.length ? <p>Missing: {status.missing.join(", ")}.</p> : null}
            <p>After setup, refresh this status and send a test. Queued inquiries will then be processed automatically; older inquiries from before this feature do not generate alerts.</p>
          </div>
        </details>}
        <p className="mt-4 text-sm text-muted-foreground">{status.pending} queued · {status.accepted} provider accepted · {status.attention} need review</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={busy !== null || !status.configured} onClick={() => run("test")}>{busy === "test" ? "Sending test…" : "Send me a test"}</Button>
          <Button type="button" variant="outline" disabled={busy !== null || !status.configured || status.pending === 0} onClick={() => run("retry")}>{busy === "retry" ? "Processing…" : "Process due alerts"}</Button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Provider accepted means the sending service received the email, not confirmed inbox delivery. Tests count in these totals. Retries use the same message to prevent duplicates.</p>
        {status.attention > 0 ? <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Alerts needing review are held. Check the provider’s sending logs and correct any setup errors; processing due alerts does not resend these held messages or accepted emails.</p> : null}
        {status.recent.length ? <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium">Recent alert activity</summary>
          <ul className="mt-2 space-y-2">
            {status.recent.map((alert, index) => <li key={`${alert.inquiry_id ?? "test"}-${index}`} className="border-t border-border pt-2">
              <span className="font-medium">{alert.kind === "test" ? "Test alert" : `Inquiry #${alert.inquiry_id}`}</span>: {STATE_LABELS[alert.state] ?? "Unknown status"}
              {alert.last_error_code ? <span className="block text-xs text-muted-foreground">{ERROR_HELP[alert.last_error_code] ?? "Review the email provider status before resending."}</span> : null}
            </li>)}
          </ul>
        </details> : null}
      </> : null}
      <p role={error ? "alert" : "status"} aria-live="polite" className={`mt-3 text-sm ${error ? "text-destructive" : "text-primary"}`}>{error || message}</p>
    </section>
  );
}
