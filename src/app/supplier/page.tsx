"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header, StatusBadge } from "@/components/ui";
import { fromCm } from "@/lib/geometry";
import { useT } from "@/lib/i18n";
import { useSupplierKey } from "@/lib/supplier";
import type { FormeRequest, Status } from "@/lib/types";

const FILTERS: Status[] = ["new", "needs_info", "ready_for_quote", "quoted", "technical_review", "production", "shipped", "declined"];

export default function Supplier() {
  const { t, lang } = useT();
  const { key, setKey, api } = useSupplierKey();
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState(false);
  const [list, setList] = useState<FormeRequest[] | null>(null);
  const [filter, setFilter] = useState<Status | "all">("all");

  useEffect(() => {
    if (!key) return;
    api("/api/requests").then(async (res) => {
      if (res.ok) setList(await res.json());
      else { setKey(null); setWrong(true); }
    }).catch(() => setList([]));
  }, [key, api, setKey]);

  if (key === undefined) return <Header />;

  if (!key)
    return (
      <>
        <Header />
        <main className="mx-auto max-w-sm px-4 py-16">
          <h1 className="font-display text-3xl text-forest">{t("sup.title")}</h1>
          <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); setWrong(false); setList(null); setKey(input.trim() || null); }}>
            <label className="label" htmlFor="key">{t("sup.key")}</label>
            <input id="key" type="password" className="field" autoComplete="current-password" value={input} onChange={(e) => setInput(e.target.value)} />
            {wrong && <p className="text-sm font-semibold text-clay" role="alert">{t("sup.wrong")}</p>}
            <button className="btn btn-primary w-full" disabled={!input.trim()}>{t("sup.login")}</button>
          </form>
        </main>
      </>
    );

  const shown = (list ?? []).filter((r) => filter === "all" || r.status === filter);
  const count = (s: Status) => (list ?? []).filter((r) => r.status === s).length;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-forest">{t("sup.title")}</h1>
          <button className="text-sm underline" onClick={() => { setKey(null); setList(null); }}>{t("sup.logout")}</button>
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setFilter("all")} aria-pressed={filter === "all"}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold ${filter === "all" ? "border-forest bg-forest text-white" : "border-line bg-white"}`}>
            {t("sup.all")} ({list?.length ?? 0})
          </button>
          {FILTERS.map((s) => (
            <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold ${filter === s ? "border-forest bg-forest text-white" : "border-line bg-white"}`}>
              {t(`status.${s}`)} ({count(s)})
            </button>
          ))}
        </div>
        {list && !shown.length && <p className="mt-10 text-moss">{t("sup.empty")}</p>}
        <ul className="mt-4 space-y-2">
          {shown.map((r) => (
            <li key={r.id}>
              <Link href={`/supplier/${r.id}`} className="card flex flex-wrap items-center gap-x-6 gap-y-2 p-4 hover:border-forest">
                <span className="w-28 font-bold tabular-nums">{r.projectNo}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sand text-xs font-bold" title={t(`ready.${r.readiness}`)}>{r.readiness}</span>
                <span className="min-w-40 flex-1">
                  <span className="block font-semibold">{r.contact.name}</span>
                  <span className="text-sm text-moss">
                    {t(`shape.${r.shape}`)} · {(["w", "d", "h"] as const).map((k) => fromCm(r.dims[k]!.value, r.unit)).join(" × ")} {r.unit}
                  </span>
                </span>
                <span className="text-sm text-moss">{new Date(r.createdAt).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB")}</span>
                <StatusBadge status={r.status} />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
