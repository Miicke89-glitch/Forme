"use client";

import { fromCm, views, type View, type ViewDim } from "@/lib/geometry";
import { useT } from "@/lib/i18n";
import type { Dims, ShapeId, Unit } from "@/lib/types";

const SIZE = 150; // ritytans längsta sida i px
const PAD = 46;

function DimLine({ dim, s, vh, label }: { dim: ViewDim; s: number; vh: number; label: string }) {
  const off = 20;
  const P = ([x, y]: [number, number]): [number, number] => [x * s, (vh - y) * s];
  let [x1, y1] = P(dim.from), [x2, y2] = P(dim.to);
  if (dim.side === "bottom") y1 = y2 = Math.max(y1, y2) + off;
  if (dim.side === "top") y1 = y2 = Math.min(y1, y2) - off;
  if (dim.side === "left") x1 = x2 = Math.min(x1, x2) - off;
  if (dim.side === "right") x1 = x2 = Math.max(x1, x2) + off;
  const horizontal = dim.side === "bottom" || dim.side === "top";
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return (
    <g stroke="#4a7fc1" strokeWidth={1}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {horizontal ? (
        <><line x1={x1} y1={y1 - 4} x2={x1} y2={y1 + 4} /><line x1={x2} y1={y2 - 4} x2={x2} y2={y2 + 4} /></>
      ) : (
        <><line x1={x1 - 4} y1={y1} x2={x1 + 4} y2={y1} /><line x1={x2 - 4} y1={y2} x2={x2 + 4} y2={y2} /></>
      )}
      <text stroke="none" fill="#16302b" fontSize={10} textAnchor="middle"
        x={horizontal ? mx : mx + (dim.side === "left" ? -5 : 5)}
        y={horizontal ? my + (dim.side === "bottom" ? 13 : -6) : my}
        transform={horizontal ? undefined : `rotate(-90 ${mx + (dim.side === "left" ? -5 : 5)} ${my})`}>
        {label}
      </text>
    </g>
  );
}

function ViewSvg({ view, dims, unit, title }: { view: View; dims: Dims; unit: Unit; title: string }) {
  const s = SIZE / Math.max(view.w, view.h, 1);
  const W = view.w * s, H = view.h * s;
  const pts = view.outline.map(([x, y]) => `${x * s},${(view.h - y) * s}`).join(" ");
  return (
    <figure className="flex flex-col items-center">
      <svg viewBox={`${-PAD} ${-PAD} ${W + PAD * 2} ${H + PAD * 2}`} className="h-52 w-full" role="img" aria-label={title}>
        {view.ellipse ? (
          <ellipse cx={W / 2} cy={H / 2} rx={W / 2} ry={H / 2} fill="#f5f1ea" stroke="#16302b" strokeWidth={1.5} />
        ) : (
          <polygon points={pts} fill="#f5f1ea" stroke="#16302b" strokeWidth={1.5} strokeLinejoin="round" />
        )}
        {view.lines.map(([a, b], i) => (
          <line key={i} x1={a[0] * s} y1={(view.h - a[1]) * s} x2={b[0] * s} y2={(view.h - b[1]) * s}
            stroke="#16302b" strokeWidth={1} strokeDasharray="4 3" />
        ))}
        {view.dims.map((d, i) => (
          <DimLine key={i} dim={d} s={s} vh={view.h} label={`${fromCm(dims[d.key]!.value, unit)} ${unit}`} />
        ))}
      </svg>
      <figcaption className="text-xs font-semibold uppercase tracking-widest text-moss">{title}</figcaption>
    </figure>
  );
}

/** Måttsatta front-, sido- och toppvyer – alltid märkta som preliminära eller godkända. */
export default function Drawings({
  shape, dims, unit, approved = false,
}: { shape: ShapeId; dims: Dims; unit: Unit; approved?: boolean }) {
  const { t } = useT();
  if (!dims.w || !dims.d || !dims.h) return null;
  return (
    <div className="card p-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-semibold">{t("views.title")}</h3>
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-widest ${approved ? "bg-forest text-white" : "bg-clay/15 text-clay"}`}>
          {t(approved ? "views.approved" : "views.preliminary")}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {views(shape, dims).map((v) => (
          <ViewSvg key={v.id} view={v} dims={dims} unit={unit} title={t(`view.${v.id}`)} />
        ))}
      </div>
    </div>
  );
}
