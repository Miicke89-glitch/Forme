"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import RequestDetails from "@/components/RequestDetails";
import { Header } from "@/components/ui";
import { fromCm, missingDims, requiredDims, SHAPES, toCm } from "@/lib/geometry";
import { useT, type Key } from "@/lib/i18n";
import { useSupplierKey } from "@/lib/supplier";
import type { DimKey, FormeRequest, ShapeId } from "@/lib/types";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="card p-4" open>
      <summary className="cursor-pointer font-semibold">{title}</summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

export default function SupplierDetail() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const { key, api } = useSupplierKey();
  const [r, setR] = useState<FormeRequest | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const [question, setQuestion] = useState("");
  const [quote, setQuote] = useState({ price: "", currency: "SEK", leadTimeDays: "", note: "" });
  const [by, setBy] = useState("");
  const [tracking, setTracking] = useState("");
  const [revShape, setRevShape] = useState<ShapeId>("box");
  const [revDims, setRevDims] = useState<Partial<Record<DimKey, string>>>({});

  function load(req: FormeRequest) {
    setR(req);
    setRevShape(req.shape);
    setRevDims(Object.fromEntries(Object.entries(req.dims).map(([k, d]) => [k, String(fromCm(d.value, req.unit))])));
  }

  useEffect(() => {
    fetch(`/api/requests/${id}`).then(async (res) => (res.ok ? load(await res.json()) : setR(null))).catch(() => setR(null));
  }, [id]);

  async function act(body: object) {
    setBusy(true);
    setFailed(false);
    try {
      const res = await api(`/api/requests/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      load(await res.json());
      setQuestion("");
    } catch {
      setFailed(true);
    }
    setBusy(false);
  }

  if (key === undefined || r === undefined) return <Header />;
  if (!key || r === null)
    return (
      <>
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-16">
          <Link className="underline" href="/supplier">← {t("sup.title")}</Link>
          {r === null && <p className="mt-4 text-lg">{t("req.notfound")}</p>}
        </main>
      </>
    );

  const s = r.status;
  const open = s !== "shipped" && s !== "declined";
  const canAsk = s === "new" || s === "needs_info" || s === "ready_for_quote" || s === "technical_review";
  const canRevise = canAsk || s === "quoted";
  const canQuote = s === "ready_for_quote" || s === "quoted";
  const incomplete = r.shape === "other" || missingDims(r.shape, r.dims).length > 0;
  const num = (x?: string) => parseFloat((x ?? "").replace(",", "."));
  const revOut = Object.fromEntries(
    requiredDims(revShape).map((k) => [k, num(revDims[k])]).filter(([, n]) => Number.isFinite(n) && (n as number) > 0)
      .map(([k, n]) => [k, toCm(n as number, r.unit)]),
  );

  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <Link className="no-print mb-4 inline-block text-sm underline" href="/supplier">← {t("sup.title")}</Link>
          <RequestDetails r={r} supplier />
        </div>

        <aside className="no-print space-y-3 lg:sticky lg:top-20 lg:self-start">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-moss">{t("sup.actions")}</h2>
          {failed && <p className="text-sm font-semibold text-clay" role="alert">{t("sup.failed")}</p>}
          {s === "quoted" && <p className="text-sm text-moss">{t("sup.waiting")}</p>}
          {!open && <p className="text-sm text-moss">{t("sup.done")}</p>}

          {(s === "new" || s === "needs_info") && (
            <button className="btn btn-primary w-full" disabled={busy} onClick={() => act({ action: "ready" })}>{t("sup.ready")}</button>
          )}

          {canQuote && (
            <Panel title={t("sup.sendQuote")}>
              <div className="grid grid-cols-[1fr_5rem] gap-2">
                <div>
                  <label className="label" htmlFor="price">{t("sup.price")}</label>
                  <input id="price" className="field" inputMode="decimal" value={quote.price} onChange={(e) => setQuote({ ...quote, price: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="cur">{t("sup.currency")}</label>
                  <select id="cur" className="field !px-2" value={quote.currency} onChange={(e) => setQuote({ ...quote, currency: e.target.value })}>
                    {["SEK", "EUR", "USD", "GBP", "NOK", "DKK"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="lead">{t("sup.leadDays")}</label>
                <input id="lead" className="field" inputMode="numeric" value={quote.leadTimeDays} onChange={(e) => setQuote({ ...quote, leadTimeDays: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="qnote">{t("sup.note")}</label>
                <textarea id="qnote" className="field" rows={2} value={quote.note} onChange={(e) => setQuote({ ...quote, note: e.target.value })} />
              </div>
              <button className="btn btn-primary w-full" disabled={busy || !(num(quote.price) > 0) || !(parseInt(quote.leadTimeDays) > 0)}
                onClick={() => act({ action: "quote", price: num(quote.price), currency: quote.currency, leadTimeDays: parseInt(quote.leadTimeDays), note: quote.note })}>
                {t("sup.sendQuote")}
              </button>
            </Panel>
          )}

          {s === "technical_review" && (
            <Panel title={t("sup.approve")}>
              <p className="text-xs text-moss">{t("sup.approveHint")}</p>
              {incomplete && <p className="text-sm font-semibold text-clay">{t("sup.incomplete")}</p>}
              <div>
                <label className="label" htmlFor="by">{t("sup.approveBy")}</label>
                <input id="by" className="field" value={by} onChange={(e) => setBy(e.target.value)} />
              </div>
              <button className="btn btn-primary w-full" disabled={busy || incomplete || !by.trim()} onClick={() => act({ action: "approve", by })}>
                {t("sup.approve")}
              </button>
            </Panel>
          )}

          {s === "production" && (
            <Panel title={t("sup.ship")}>
              <label className="label" htmlFor="track">{t("sup.tracking")}</label>
              <input id="track" className="field" value={tracking} onChange={(e) => setTracking(e.target.value)} />
              <button className="btn btn-primary w-full" disabled={busy} onClick={() => act({ action: "ship", tracking })}>{t("sup.ship")}</button>
            </Panel>
          )}

          {canAsk && (
            <Panel title={t("sup.ask")}>
              <textarea className="field" rows={2} maxLength={1000} placeholder={t("sup.askPh")} aria-label={t("sup.ask")}
                value={question} onChange={(e) => setQuestion(e.target.value)} />
              <button className="btn btn-ghost w-full" disabled={busy || !question.trim()} onClick={() => act({ action: "ask", text: question })}>{t("sup.send")}</button>
            </Panel>
          )}

          {canRevise && (
            <Panel title={t("sup.revise")}>
              <select className="field" aria-label={t("dims.shape")} value={revShape} onChange={(e) => setRevShape(e.target.value as ShapeId)}>
                {SHAPES.map((sh) => <option key={sh} value={sh}>{t(`shape.${sh}`)}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                {requiredDims(revShape).map((k) => (
                  <div key={k}>
                    <label className="label" htmlFor={`rev-${k}`}>{t(`dim.${k}` as Key)} ({r.unit})</label>
                    <input id={`rev-${k}`} className="field" inputMode="decimal" value={revDims[k] ?? ""}
                      onChange={(e) => setRevDims({ ...revDims, [k]: e.target.value })} />
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost w-full" disabled={busy} onClick={() => act({ action: "revise", shape: revShape, dims: revOut })}>{t("sup.saveRev")}</button>
            </Panel>
          )}

          <button className="btn btn-ghost w-full" onClick={() => window.print()}>{t("req.print")}</button>
          {open && s !== "production" && (
            <button className="w-full text-sm text-clay underline" disabled={busy}
              onClick={() => act({ action: "decline" })}>{t("sup.decline")}</button>
          )}
        </aside>
      </main>
    </>
  );
}
