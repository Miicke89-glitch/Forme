import type { DimKey, Dims, Readiness, ShapeId } from "./types";

/**
 * Teknisk motor: all geometri beräknas av programkod från bekräftade mått och
 * parametriska formmallar. Samma värden driver 3D-modellen och de tre 2D-vyerna
 * så att underlagen aldrig motsäger varandra.
 */

export const SHAPES: ShapeId[] = ["box", "cylinder", "sloped", "lshape", "other"];

/** Extra mått som en mall behöver utöver bredd, djup och höjd. */
export const EXTRA_DIMS: Record<ShapeId, DimKey[]> = {
  box: [],
  cylinder: [],
  sloped: ["h2"],
  lshape: ["cw", "cd"],
  other: [],
};

export const MIN_CM = 1;
export const MAX_CM = 1000;

export type DimIssue = { key: DimKey; code: "range" | "tooLarge" | "extreme" };

const v = (dims: Dims, k: DimKey) => dims[k]?.value;

export function requiredDims(shape: ShapeId): DimKey[] {
  return ["w", "d", "h", ...EXTRA_DIMS[shape]];
}

export function missingDims(shape: ShapeId, dims: Dims): DimKey[] {
  return requiredDims(shape).filter((k) => !(Number(v(dims, k)) > 0));
}

/** Rimlighetskontroll. "range"/"tooLarge" blockerar, "extreme" är en varning. */
export function validateDims(shape: ShapeId, dims: Dims): DimIssue[] {
  const issues: DimIssue[] = [];
  const keys = Object.keys(dims) as DimKey[];
  for (const k of keys) {
    const val = v(dims, k);
    if (val === undefined) continue;
    if (!Number.isFinite(val) || val < MIN_CM || val > MAX_CM) issues.push({ key: k, code: "range" });
  }
  const w = v(dims, "w"), d = v(dims, "d"), h = v(dims, "h");
  if (shape === "sloped" && h && v(dims, "h2") !== undefined && v(dims, "h2")! >= h)
    issues.push({ key: "h2", code: "tooLarge" });
  if (shape === "lshape") {
    if (w && v(dims, "cw") !== undefined && v(dims, "cw")! >= w) issues.push({ key: "cw", code: "tooLarge" });
    if (d && v(dims, "cd") !== undefined && v(dims, "cd")! >= d) issues.push({ key: "cd", code: "tooLarge" });
  }
  if (w && d && h && !issues.length) {
    const max = Math.max(w, d, h), min = Math.min(w, d, h);
    if (max / min > 40) issues.push({ key: max === w ? "w" : max === d ? "d" : "h", code: "extreme" });
  }
  return issues;
}

export const blockingIssues = (issues: DimIssue[]) => issues.filter((i) => i.code !== "extreme");

export function readiness(shape: ShapeId, dims: Dims): Readiness {
  if (shape === "other") return "C";
  return missingDims(shape, dims).length ? "B" : "A";
}

/** Har vi tillräckligt för att rita mallen? Annars faller vi tillbaka på en låda. */
export function drawableShape(shape: ShapeId, dims: Dims): ShapeId {
  if (shape === "other") return "box";
  const ok = !missingDims(shape, dims).length && !blockingIssues(validateDims(shape, dims)).length;
  return ok ? shape : "box";
}

export type Pt = [number, number];

/** Planform sedd uppifrån: x = bredd, y = djup (0 = framsida). */
export function footprint(shape: ShapeId, dims: Dims): Pt[] {
  const w = v(dims, "w") ?? 0, d = v(dims, "d") ?? 0;
  if (shape === "lshape") {
    const cw = v(dims, "cw")!, cd = v(dims, "cd")!;
    return [[0, 0], [w, 0], [w, d - cd], [w - cw, d - cd], [w - cw, d], [0, d]];
  }
  return [[0, 0], [w, 0], [w, d], [0, d]];
}

/** Sidoprofil: x = djup (0 = framsida), y = höjd. */
export function sideProfile(shape: ShapeId, dims: Dims): Pt[] {
  const d = v(dims, "d") ?? 0, h = v(dims, "h") ?? 0;
  if (shape === "sloped") return [[0, 0], [d, 0], [d, h], [0, v(dims, "h2")!]];
  return [[0, 0], [d, 0], [d, h], [0, h]];
}

export type ViewDim = { key: DimKey; from: Pt; to: Pt; side: "bottom" | "left" | "right" | "top" };
export type View = {
  id: "front" | "side" | "top";
  w: number;
  h: number;
  outline: Pt[];
  ellipse?: boolean;
  lines: [Pt, Pt][];
  dims: ViewDim[];
};

/** Måttsatta front-, sido- och toppvyer. y pekar uppåt (SVG-komponenten vänder). */
export function views(shapeIn: ShapeId, dims: Dims): View[] {
  const shape = drawableShape(shapeIn, dims);
  const w = v(dims, "w") ?? 0, d = v(dims, "d") ?? 0, h = v(dims, "h") ?? 0;
  const rect = (a: number, b: number): Pt[] => [[0, 0], [a, 0], [a, b], [0, b]];

  const front: View = {
    id: "front", w, h, outline: rect(w, h), lines: [],
    dims: [
      { key: "w", from: [0, 0], to: [w, 0], side: "bottom" },
      { key: "h", from: [0, 0], to: [0, h], side: "left" },
    ],
  };
  const side: View = {
    id: "side", w: d, h, outline: sideProfile(shape, dims), lines: [],
    dims: [
      { key: "d", from: [0, 0], to: [d, 0], side: "bottom" },
      { key: "h", from: [d, 0], to: [d, h], side: "right" },
    ],
  };
  const top: View = {
    id: "top", w, h: d, outline: footprint(shape, dims), ellipse: shape === "cylinder", lines: [],
    dims: [
      { key: "w", from: [0, 0], to: [w, 0], side: "bottom" },
      { key: "d", from: [0, 0], to: [0, d], side: "left" },
    ],
  };

  if (shape === "sloped") {
    const h2 = v(dims, "h2")!;
    front.lines.push([[0, h2], [w, h2]]);
    side.dims.push({ key: "h2", from: [0, 0], to: [0, h2], side: "left" });
  }
  if (shape === "lshape") {
    const cw = v(dims, "cw")!, cd = v(dims, "cd")!;
    front.lines.push([[w - cw, 0], [w - cw, h]]);
    side.lines.push([[d - cd, 0], [d - cd, h]]);
    top.dims.push({ key: "cw", from: [w - cw, d], to: [w, d], side: "top" });
    top.dims.push({ key: "cd", from: [w, d - cd], to: [w, d], side: "right" });
  }
  return [front, side, top];
}

export const CM_PER_IN = 2.54;
export const toCm = (val: number, unit: "cm" | "in") => (unit === "in" ? val * CM_PER_IN : val);
export const fromCm = (cm: number, unit: "cm" | "in") =>
  unit === "in" ? Math.round((cm / CM_PER_IN) * 10) / 10 : Math.round(cm * 10) / 10;
