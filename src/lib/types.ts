export type ShapeId = "box" | "cylinder" | "sloped" | "lshape" | "other";
export type Unit = "cm" | "in";

/** Varifrån ett mått kommer – kundbekräftat, föreslaget eller korrigerat av leverantör. */
export type DimSource = "customer" | "suggested" | "supplier";
export type DimKey = "w" | "d" | "h" | "h2" | "cw" | "cd";
export type Dim = { value: number; source: DimSource };
/** Alla mått lagras i centimeter. */
export type Dims = Partial<Record<DimKey, Dim>>;

/** A = räcker för preliminär offert, B = mått saknas, C = manuell bedömning. */
export type Readiness = "A" | "B" | "C";

export type Status =
  | "new"
  | "needs_info"
  | "ready_for_quote"
  | "quoted"
  | "technical_review"
  | "production"
  | "shipped"
  | "declined";

export type Photo = { view: "front" | "side" | "other"; dataUrl: string };
export type Message = { from: "customer" | "supplier"; text: string; at: string };
export type HistoryEntry = { at: string; rev: number; event: string };

export type Quote = { price: number; currency: string; leadTimeDays: number; note?: string };

export type FormeRequest = {
  id: string;
  projectNo: string;
  createdAt: string;
  revision: number;
  status: Status;
  shape: ShapeId;
  unit: Unit;
  dims: Dims;
  readiness: Readiness;
  photos: Photo[];
  color: string;
  notes: string;
  contact: { name: string; email: string; country: string; company?: string };
  quote?: Quote;
  measurementApproved?: { at: string; by: string };
  tracking?: string;
  messages: Message[];
  history: HistoryEntry[];
};
