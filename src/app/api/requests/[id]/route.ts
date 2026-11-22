import { NextResponse } from "next/server";
import { missingDims } from "@/lib/geometry";
import { bad, isShape, isSupplier, log, parseDims, refreshReadiness, str } from "@/lib/server";
import { getRequest, updateRequest } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

/** Förfrågans id är en slumpad, ogissbar länk som kunden får – den fungerar som behörighet. */
export async function GET(_req: Request, { params }: Ctx) {
  const r = await getRequest((await params).id);
  return r ? NextResponse.json(r) : bad("not found", 404);
}

class ActionError extends Error {}

/** Leverantörens handlingar. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!isSupplier(req)) return bad("unauthorized", 401);
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
        case "ask": {
          const text = str(body.text, 1000) || fail("text");
          r.messages.push({ from: "supplier", text, at: now });
          r.status = "needs_info";
          log(r, "Komplettering begärd");
          break;
        }
        case "ready":
          r.status = "ready_for_quote";
          log(r, "Underlag kontrollerat – klar för offert");
          break;
        case "revise": {
          const shape = isShape(body.shape) ? body.shape : fail("shape");
          const dims = parseDims(shape, body.dims, "supplier") || fail("dims");
          // Behåll ursprunget för mått som leverantören inte ändrat.
          for (const k of Object.keys(dims) as (keyof typeof dims)[]) {
            const old = r.dims[k];
            if (r.shape === shape && old && old.value === dims[k]!.value) dims[k] = old;
          }
          r.shape = shape;
          r.dims = dims;
          r.revision += 1;
          r.measurementApproved = undefined;
          refreshReadiness(r);
          log(r, `Konstruktion korrigerad av leverantör (rev ${r.revision})`);
          break;
        }
        case "quote": {
          const price = Number(body.price);
          const lead = Number(body.leadTimeDays);
          if (!(price > 0) || !(lead > 0) || !Number.isInteger(lead)) fail("quote");
          r.quote = {
            price: Math.round(price * 100) / 100,
            currency: /^[A-Z]{3}$/.test(str(body.currency, 3)) ? str(body.currency, 3) : "SEK",
            leadTimeDays: lead,
            note: str(body.note, 1000) || undefined,
          };
          r.status = "quoted";
          log(r, `Offert skickad: ${r.quote.price} ${r.quote.currency}, ${lead} dagar`);
          break;
        }
        case "approve": {
          // Kvalitetskrav: ingen produktionsorder utan dokumenterat måttgodkännande.
          if (r.status !== "technical_review") fail("status");
          if (r.shape === "other" || missingDims(r.shape, r.dims).length) fail("incomplete");
          const by = str(body.by, 120) || fail("by");
          r.measurementApproved = { at: now, by };
          r.status = "production";
          log(r, `Mått och konstruktion godkända av ${by} – i produktion`);
          break;
        }
        case "ship":
          if (r.status !== "production") fail("status");
          r.tracking = str(body.tracking, 200) || undefined;
          r.status = "shipped";
          log(r, "Skickad" + (r.tracking ? ` (spårning: ${r.tracking})` : ""));
          break;
        case "decline":
          r.status = "declined";
          log(r, "Avslagen av leverantör");
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
