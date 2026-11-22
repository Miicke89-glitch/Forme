"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import RequestDetails from "@/components/RequestDetails";
import { Footer, Header } from "@/components/ui";
import { useT } from "@/lib/i18n";
import type { FormeRequest } from "@/lib/types";

function RequestPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const isNew = useSearchParams().get("new") === "1";
  const [r, setR] = useState<FormeRequest | null | undefined>(undefined);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(`/api/requests/${id}`).then(async (res) => setR(res.ok ? await res.json() : null)).catch(() => setR(null));
  }, [id]);

  async function act(body: object) {
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/requests/${id}/customer`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setR(await res.json());
      setReply("");
    } catch {
      setFailed(true);
    }
    setBusy(false);
  }

  if (r === undefined) return <main className="mx-auto max-w-4xl px-4 py-16 text-moss">…</main>;
  if (r === null) return <main className="mx-auto max-w-4xl px-4 py-16 text-lg">{t("req.notfound")}</main>;

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      {isNew && (
        <div className="no-print rounded-2xl bg-forest px-5 py-4 text-white">
          <p className="text-lg font-semibold">{t("req.thanks")}</p>
          <p className="text-sm text-white/80">{t("req.save")}</p>
        </div>
      )}

      {r.status === "needs_info" && (
        <div className="card no-print border-clay p-5">
          <h2 className="font-semibold text-clay">{t("status.needs_info")}</h2>
          <p className="mt-2 whitespace-pre-wrap">{[...r.messages].reverse().find((m) => m.from === "supplier")?.text}</p>
          <label className="label mt-4" htmlFor="reply">{t("req.reply")}</label>
          <textarea id="reply" className="field" rows={2} maxLength={1000} value={reply} onChange={(e) => setReply(e.target.value)} />
          <button className="btn btn-primary mt-3" disabled={busy || !reply.trim()} onClick={() => act({ action: "reply", text: reply })}>
            {t("req.sendReply")}
          </button>
        </div>
      )}

      {r.quote && (
        <div className="card p-5">
          <h2 className="font-semibold">{t("req.quote")}</h2>
          <p className="mt-2 text-3xl font-bold tabular-nums text-forest">
            {r.quote.price.toLocaleString("sv-SE")} {r.quote.currency}
          </p>
          <p className="text-sm">{t("req.lead")}: {r.quote.leadTimeDays} {t("req.days")}</p>
          {r.quote.note && <p className="mt-2 whitespace-pre-wrap text-sm">{r.quote.note}</p>}
          <p className="mt-2 text-xs text-moss">{t("req.quoteNote")}</p>
          {r.tracking && <p className="mt-2 text-sm font-semibold">{t("req.tracking")}: {r.tracking}</p>}
          {r.status === "quoted" && (
            <div className="no-print mt-4 flex gap-3">
              <button className="btn btn-primary" disabled={busy} onClick={() => act({ action: "accept" })}>{t("req.accept")}</button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => act({ action: "reject" })}>{t("req.reject")}</button>
            </div>
          )}
        </div>
      )}
      {failed && <p className="text-sm font-semibold text-clay" role="alert">{t("quote.error")}</p>}

      <RequestDetails r={r} />
      <button className="btn btn-ghost no-print" onClick={() => window.print()}>{t("req.print")}</button>
    </main>
  );
}

export default function Page() {
  return (
    <>
      <Header />
      <Suspense><RequestPage /></Suspense>
      <Footer />
    </>
  );
}
