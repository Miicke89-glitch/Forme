"use client";

import dynamic from "next/dynamic";
import Drawings from "@/components/Drawings";
import { DimTable, ReadinessBadge, StatusBadge } from "@/components/ui";
import { drawableShape } from "@/lib/geometry";
import { useT } from "@/lib/i18n";
import type { FormeRequest } from "@/lib/types";

const Preview3D = dynamic(() => import("@/components/Preview3D"), { ssr: false });

const date = (iso: string, lang: string) =>
  new Date(iso).toLocaleString(lang === "sv" ? "sv-SE" : "en-GB", { dateStyle: "medium", timeStyle: "short" });

/** FORME Production Pack: samma strukturerade underlag för kund, leverantör och utskrift. */
export default function RequestDetails({ r, supplier = false }: { r: FormeRequest; supplier?: boolean }) {
  const { t, lang } = useT();
  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-x-8 gap-y-3 p-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-moss">{t("pack.title")}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{r.projectNo}</div>
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div><dt className="text-moss">{t("req.revision")}</dt><dd className="font-semibold">{r.revision}</dd></div>
          <div><dt className="text-moss">{date(r.createdAt, lang)}</dt><dd className="font-semibold">{t(`shape.${r.shape}`)}</dd></div>
          <div><dt className="text-moss">{t("req.status")}</dt><dd><StatusBadge status={r.status} /></dd></div>
        </dl>
      </div>

      <ReadinessBadge value={r.readiness} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-3 font-semibold">{t("req.photos")}</h3>
          <div className="grid grid-cols-3 gap-2">
            {r.photos.map((p, i) => (
              <a key={i} href={p.dataUrl} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.dataUrl} alt={t(`photo.${p.view}`)} className="aspect-[3/4] w-full rounded-xl object-cover" />
                <span className="mt-1 block text-center text-xs text-moss">{t(`photo.${p.view}`)}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="mb-1 font-semibold">{t("req.measurements")}</h3>
          <DimTable shape={r.shape} dims={r.dims} unit={r.unit} />
          {r.measurementApproved && (
            <p className="mt-3 rounded-lg bg-forest/10 px-3 py-2 text-xs font-semibold text-forest">
              {t("req.approvedBy")} {r.measurementApproved.by} · {date(r.measurementApproved.at, lang)}
            </p>
          )}
        </div>
      </div>

      <div className="card no-print p-4">
        <Preview3D shape={r.shape} dims={r.dims} color={r.color} className="aspect-[16/9] w-full rounded-2xl bg-sand" />
        <p className="mt-2 text-xs text-moss">
          {t("preview.illustration")} {drawableShape(r.shape, r.dims) !== r.shape && t("preview.fallback")}
        </p>
      </div>

      <Drawings shape={r.shape} dims={r.dims} unit={r.unit} approved={!!r.measurementApproved} />

      {(supplier || r.notes) && (
        <div className="card grid gap-4 p-4 text-sm md:grid-cols-2">
          {supplier && (
            <div>
              <h3 className="mb-1 font-semibold">{t("req.contact")}</h3>
              <p>{r.contact.name}{r.contact.company ? ` · ${r.contact.company}` : ""}</p>
              <p><a className="underline" href={`mailto:${r.contact.email}`}>{r.contact.email}</a></p>
              <p>{r.contact.country}</p>
            </div>
          )}
          {r.notes && (
            <div>
              <h3 className="mb-1 font-semibold">{t("req.notes")}</h3>
              <p className="whitespace-pre-wrap">{r.notes}</p>
            </div>
          )}
        </div>
      )}

      {r.messages.length > 0 && (
        <div className="card p-4">
          <h3 className="mb-3 font-semibold">{t("req.messages")}</h3>
          <ul className="space-y-2">
            {r.messages.map((m, i) => (
              <li key={i} className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.from === "supplier" ? "bg-sand" : "ml-auto bg-forest/10"}`}>
                <div className="text-xs text-moss">{t(`msg.${m.from}`)} · {date(m.at, lang)}</div>
                <p className="whitespace-pre-wrap">{m.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card p-4">
        <h3 className="mb-2 font-semibold">{t("req.history")}</h3>
        <ol className="space-y-1 text-sm">
          {r.history.map((h, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-12 shrink-0 font-semibold tabular-nums text-moss">Rev {h.rev}</span>
              <span className="flex-1">{h.event}</span>
              <span className="shrink-0 text-xs text-moss">{date(h.at, lang)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
