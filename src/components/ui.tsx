"use client";

import Link from "next/link";
import { fromCm, requiredDims } from "@/lib/geometry";
import { useT, type Key } from "@/lib/i18n";
import type { Dims, Readiness, ShapeId, Status, Unit } from "@/lib/types";

export function Header() {
  const { t, lang, setLang } = useT();
  return (
    <header className="no-print sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="wordmark text-lg text-forest">FORME</Link>
        <nav className="flex items-center gap-2 text-sm sm:gap-4">
          <Link href="/#how" className="hidden hover:text-forest sm:inline">{t("nav.how")}</Link>
          <button onClick={() => setLang(lang === "en" ? "sv" : "en")} aria-label="Language / Språk"
            className="rounded-full border border-line px-3 py-1.5 font-semibold hover:border-forest">
            {lang === "en" ? "SV" : "EN"}
          </button>
          <Link href="/order" className="btn btn-primary !px-4 !py-2">{t("nav.order")}</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useT();
  return (
    <footer className="no-print mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-moss sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl space-y-1">
          <div className="wordmark text-forest">FORME</div>
          <p>{t("footer.note")}</p>
          <p>{t("footer.privacy")}</p>
        </div>
        <Link href="/supplier" className="underline underline-offset-4 hover:text-forest">{t("nav.supplier")}</Link>
      </div>
    </footer>
  );
}

const READY_STYLE: Record<Readiness, string> = {
  A: "bg-forest/10 text-forest border-forest/30",
  B: "bg-clay/10 text-clay border-clay/40",
  C: "bg-sky/10 text-sky border-sky/40",
};

export function ReadinessBadge({ value }: { value: Readiness }) {
  const { t } = useT();
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${READY_STYLE[value]}`} role="status">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white font-bold">{value}</span>
      {t(`ready.${value}`)}
    </div>
  );
}

const STATUS_STYLE: Record<Status, string> = {
  new: "bg-sky/15 text-sky",
  needs_info: "bg-clay/15 text-clay",
  ready_for_quote: "bg-moss/15 text-moss",
  quoted: "bg-forest/15 text-forest",
  technical_review: "bg-sky/15 text-sky",
  production: "bg-forest text-white",
  shipped: "bg-ink text-white",
  declined: "bg-line text-ink",
};

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useT();
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}>
      {t(`status.${status}`)}
    </span>
  );
}

/** Måttlista som visar varje måtts ursprung och markerar okända mått. */
export function DimTable({ shape, dims, unit }: { shape: ShapeId; dims: Dims; unit: Unit }) {
  const { t } = useT();
  return (
    <table className="w-full text-sm">
      <tbody>
        {requiredDims(shape).map((k) => {
          const d = dims[k];
          return (
            <tr key={k} className="border-b border-line last:border-0">
              <td className="py-2 pr-2">{t(`dim.${k}` as Key)}</td>
              <td className="whitespace-nowrap py-2 pr-2 text-right font-semibold tabular-nums">
                {d ? `${fromCm(d.value, unit)} ${unit}` : "—"}
              </td>
              <td className={`py-2 text-right text-xs ${d && d.source !== "suggested" ? "text-moss" : "font-semibold text-clay"}`}>
                {t(d ? `src.${d.source}` : "src.unknown")}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function ShapeIcon({ shape }: { shape: ShapeId }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden>
      {shape === "box" && <rect x="6" y="10" width="28" height="20" {...p} />}
      {shape === "cylinder" && <><ellipse cx="20" cy="11" rx="12" ry="4" {...p} /><path d="M8 11v18c0 2.2 5.4 4 12 4s12-1.8 12-4V11" {...p} /></>}
      {shape === "sloped" && <path d="M6 32h28V8L6 20z" {...p} />}
      {shape === "lshape" && <path d="M6 6h14v14h14v14H6z" {...p} />}
      {shape === "other" && <path d="M14 15a6 6 0 1 1 8.5 5.5c-1.6.8-2.5 1.8-2.5 3.5M20 30v1" {...p} strokeLinecap="round" />}
    </svg>
  );
}
