import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { blockingIssues, readiness, requiredDims, validateDims } from "./geometry";
import type { DimKey, Dims, DimSource, FormeRequest, ShapeId } from "./types";

export const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** Leverantörsportalen skyddas av en delad nyckel i MVP:n (ersätts av rollbaserad inloggning). */
export function isSupplier(req: Request): boolean {
  const expected =
    process.env.SUPPLIER_KEY || (process.env.NODE_ENV === "production" ? "" : "forme-demo");
  const given = req.headers.get("x-forme-key") || "";
  if (!expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export const str = (x: unknown, max: number) => (typeof x === "string" ? x.trim().slice(0, max) : "");

const SHAPES: ShapeId[] = ["box", "cylinder", "sloped", "lshape", "other"];
export const isShape = (x: unknown): x is ShapeId => SHAPES.includes(x as ShapeId);

/** Tar emot { w: 120, ... } i cm och bygger Dims. Returnerar null om något mått är orimligt. */
export function parseDims(shape: ShapeId, raw: unknown, source: DimSource): Dims | null {
  if (!raw || typeof raw !== "object") return null;
  const dims: Dims = {};
  for (const k of requiredDims(shape)) {
    const val = (raw as Record<string, unknown>)[k];
    if (val === undefined || val === null || val === "") continue;
    if (typeof val !== "number" || !Number.isFinite(val)) return null;
    dims[k as DimKey] = { value: Math.round(val * 10) / 10, source };
  }
  if (!dims.w || !dims.d || !dims.h) return null;
  if (blockingIssues(validateDims(shape, dims)).length) return null;
  return dims;
}

export function log(r: FormeRequest, event: string) {
  r.history.push({ at: new Date().toISOString(), rev: r.revision, event });
}

export function refreshReadiness(r: FormeRequest) {
  r.readiness = readiness(r.shape, r.dims);
}

/** Listvyn skickar inte med bilddata. */
export const summary = (r: FormeRequest) => ({ ...r, photos: r.photos.map((p) => ({ view: p.view })) });
