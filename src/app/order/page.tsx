"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Drawings from "@/components/Drawings";
import { Header, ReadinessBadge, ShapeIcon } from "@/components/ui";
import {
  blockingIssues, drawableShape, EXTRA_DIMS, readiness, SHAPES, toCm, validateDims,
} from "@/lib/geometry";
import { useT, type Key } from "@/lib/i18n";
import type { DimKey, Dims, Photo, ShapeId, Unit } from "@/lib/types";

const Preview3D = dynamic(() => import("@/components/Preview3D"), { ssr: false });

const COLORS = ["#3d6b5f", "#2b2f33", "#8a8f94", "#b9a888", "#34507a"];
const SLOTS: Photo["view"][] = ["front", "side", "other"];

/** Skalar ner bilden i webbläsaren så att uppladdningen blir snabb även på mobilnät. */
async function toDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}

export default function Order() {
  const { t } = useT();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<Partial<Record<Photo["view"], string>>>({});
  const [photoError, setPhotoError] = useState(false);
  const [unit, setUnit] = useState<Unit>("cm");
  const [raw, setRaw] = useState<Partial<Record<DimKey, string>>>({});
  const [shape, setShape] = useState<ShapeId>("box");
  const [color, setColor] = useState(COLORS[0]);
  const [contact, setContact] = useState({ name: "", email: "", country: "", company: "" });
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  const dims = useMemo(() => {
    const out: Dims = {};
    for (const k of ["w", "d", "h", ...EXTRA_DIMS[shape]] as DimKey[]) {
      const n = parseFloat((raw[k] ?? "").replace(",", "."));
      if (Number.isFinite(n) && n > 0) out[k] = { value: Math.round(toCm(n, unit) * 10) / 10, source: "customer" };
    }
    return out;
  }, [raw, unit, shape]);

  const issues = validateDims(shape, dims);
  const issueFor = (k: DimKey) => issues.find((i) => i.key === k);
  const hasBase = !!(dims.w && dims.d && dims.h);
  const dimsOk = hasBase && !blockingIssues(issues).length;
  const ready = readiness(shape, dims);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim());
  const canNext = [Object.keys(photos).length > 0, dimsOk, true, !!contact.name.trim() && emailOk][step];

  async function addPhoto(view: Photo["view"], file?: File) {
    if (!file) return;
    try {
      const url = await toDataUrl(file);
      setPhotos((p) => ({ ...p, [view]: url }));
      setPhotoError(false);
    } catch {
      setPhotoError(true);
    }
  }

  async function submit() {
    setSending(true);
    setError(false);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shape, unit, color, notes, contact,
          dims: Object.fromEntries(Object.entries(dims).map(([k, v]) => [k, v.value])),
          photos: SLOTS.filter((v) => photos[v]).map((v) => ({ view: v, dataUrl: photos[v] })),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { id } = await res.json();
      router.push(`/request/${id}?new=1`);
    } catch {
      setError(true);
      setSending(false);
    }
  }

  const dimInput = (k: DimKey) => {
    const issue = issueFor(k);
    return (
      <div key={k}>
        <label className="label" htmlFor={`dim-${k}`}>{t(`dim.${k}` as Key)}</label>
        <div className="relative">
          <input id={`dim-${k}`} className="field pr-12 text-lg" inputMode="decimal" autoComplete="off"
            value={raw[k] ?? ""} aria-invalid={!!issue}
            onChange={(e) => setRaw((r) => ({ ...r, [k]: e.target.value.replace(/[^\d.,]/g, "") }))} />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-moss">{unit}</span>
        </div>
        {issue && (
          <p className={`mt-1 text-xs ${issue.code === "extreme" ? "text-moss" : "font-semibold text-clay"}`}>
            {t(`issue.${issue.code}`)}
          </p>
        )}
      </div>
    );
  };

  const steps: Key[] = ["step.photo", "step.dims", "step.preview", "step.quote"];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 pb-32 pt-6">
        <ol className="mb-8 flex gap-2" aria-label="Progress">
          {steps.map((s, i) => (
            <li key={s} className="flex-1" aria-current={i === step ? "step" : undefined}>
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-forest" : "bg-line"}`} />
              <span className={`mt-2 block text-xs font-semibold ${i === step ? "text-forest" : "text-moss/70"}`}>
                {i + 1}. {t(s)}
              </span>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <section>
            <h1 className="font-display text-3xl text-forest">{t("photo.title")}</h1>
            <p className="mt-2 text-ink/75">{t("photo.body")}</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {SLOTS.map((view) => (
                <div key={view}>
                  <label className={`relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center text-sm ${photos[view] ? "border-forest" : "border-line bg-white hover:border-moss"}`}>
                    {photos[view] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photos[view]} alt={t(`photo.${view}`)} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <>
                        <span className="text-3xl leading-none text-moss">+</span>
                        <span className="mt-2 px-1 font-semibold">{t(`photo.${view}`)}</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="sr-only" aria-label={`${t("photo.add")}: ${t(`photo.${view}`)}`}
                      onChange={(e) => { addPhoto(view, e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                  {photos[view] && (
                    <button className="mt-1 w-full text-xs text-moss underline"
                      onClick={() => setPhotos((p) => { const n = { ...p }; delete n[view]; return n; })}>
                      {t("photo.remove")}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {photoError && <p className="mt-3 text-sm font-semibold text-clay">{t("photo.error")}</p>}
            <details className="card mt-6 p-4 text-sm">
              <summary className="cursor-pointer font-semibold">{t("photo.tips")}</summary>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-ink/80">
                <li>{t("photo.tip1")}</li><li>{t("photo.tip2")}</li><li>{t("photo.tip3")}</li><li>{t("photo.privacy")}</li>
              </ul>
            </details>
          </section>
        )}

        {step === 1 && (
          <section>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl text-forest">{t("dims.title")}</h1>
                <p className="mt-2 text-ink/75">{t("dims.body")}</p>
              </div>
              <div className="flex shrink-0 rounded-full border border-line bg-white p-1 text-sm" role="group" aria-label={t("dims.unit")}>
                {(["cm", "in"] as Unit[]).map((u) => (
                  <button key={u} onClick={() => setUnit(u)} aria-pressed={unit === u}
                    className={`rounded-full px-3 py-1 font-semibold ${unit === u ? "bg-forest text-white" : ""}`}>{u}</button>
                ))}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">{(["w", "d", "h"] as DimKey[]).map(dimInput)}</div>

            <h2 className="mt-8 font-semibold">{t("dims.shape")}</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {SHAPES.map((s) => (
                <button key={s} onClick={() => setShape(s)} aria-pressed={shape === s}
                  className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-xs font-semibold ${shape === s ? "border-forest bg-forest text-white" : "border-line bg-white hover:border-moss"}`}>
                  <ShapeIcon shape={s} />
                  {t(`shape.${s}`)}
                </button>
              ))}
            </div>

            {EXTRA_DIMS[shape].length > 0 && (
              <div className="card mt-6 p-4">
                <h3 className="font-semibold">{t("dims.extra")}</h3>
                <div className="mt-3 grid grid-cols-2 gap-3">{EXTRA_DIMS[shape].map(dimInput)}</div>
                <p className="mt-3 text-xs text-moss">{t("dims.extraHint")}</p>
              </div>
            )}
            {shape === "other" && <p className="mt-4 text-sm text-moss">{t("dims.otherHint")}</p>}
            {hasBase && <div className="mt-6"><ReadinessBadge value={ready} /></div>}
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="font-display text-3xl text-forest">{t("preview.title")}</h1>
            <p className="mt-2 text-ink/75">{t("preview.body")}</p>
            <Preview3D shape={shape} dims={dims} color={color} className="mt-5 aspect-[4/3] w-full rounded-3xl bg-sand" />
            <p className="mt-2 text-xs text-moss">
              {t("preview.illustration")}{" "}
              {drawableShape(shape, dims) !== shape && t("preview.fallback")}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-semibold">{t("preview.color")}</span>
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} aria-label={c} aria-pressed={color === c}
                  className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-ink ring-2 ring-white ring-inset" : "border-line"}`}
                  style={{ background: c }} />
              ))}
            </div>
            <div className="mt-6 space-y-4">
              <ReadinessBadge value={ready} />
              <Drawings shape={shape} dims={dims} unit={unit} />
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="font-display text-3xl text-forest">{t("quote.title")}</h1>
            <p className="mt-2 text-ink/75">{t("quote.body")}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">{t("quote.name")}</label>
                <input id="name" className="field" autoComplete="name" value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="email">{t("quote.email")}</label>
                <input id="email" type="email" className="field" autoComplete="email" value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="country">{t("quote.country")}</label>
                <input id="country" className="field" autoComplete="country-name" value={contact.country}
                  onChange={(e) => setContact({ ...contact, country: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="company">{t("quote.company")}</label>
                <input id="company" className="field" autoComplete="organization" value={contact.company}
                  onChange={(e) => setContact({ ...contact, company: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="notes">{t("quote.notes")}</label>
                <textarea id="notes" className="field" rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <p className="mt-4 text-xs text-moss">{t("quote.consent")}</p>
            {error && <p className="mt-3 text-sm font-semibold text-clay" role="alert">{t("quote.error")}</p>}
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-3 px-4 py-3">
          {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)} disabled={sending}>{t("back")}</button>}
          {step < 3 ? (
            <button className="btn btn-primary flex-1" disabled={!canNext} onClick={() => setStep(step + 1)}>{t("next")} →</button>
          ) : (
            <button className="btn btn-primary flex-1" disabled={!canNext || sending} onClick={submit}>
              {t(sending ? "quote.sending" : "quote.send")}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
