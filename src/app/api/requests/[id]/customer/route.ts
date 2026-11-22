import { NextResponse } from "next/server";
import { bad, log, str } from "@/lib/server";
import { updateRequest } from "@/lib/store";

class ActionError extends Error {}

/** Kundens handlingar: svara på komplettering, godkänna eller avstå offert. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("invalid json");
  }
  const now = new Date().toISOString();
  try {
    const r = await updateRequest((await params).id, (r) => {
      const fail = (m: string) => {
        throw new ActionError(m);
      };
      switch (body.action) {
        case "reply": {
          const text = str(body.text, 1000) || fail("text");
          r.messages.push({ from: "customer", text, at: now });
          if (r.status === "needs_info") r.status = "new";
          log(r, "Kunden svarade på komplettering");
          break;
        }
        case "accept":
          if (r.status !== "quoted") fail("status");
          r.status = "technical_review";
          log(r, "Offert godkänd av kund – teknisk kontroll");
          break;
        case "reject":
          if (r.status !== "quoted") fail("status");
          r.status = "declined";
          log(r, "Kunden avstod offerten");
          break;
        default:
          fail("action");
      }
    });
    return r ? NextResponse.json(r) : bad("not found", 404);
  } catch (e) {
    if (e instanceof ActionError) return bad(e.message, 422);
    throw e;
  }
}
