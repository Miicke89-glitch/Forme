import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { readiness } from "@/lib/geometry";
import { bad, isShape, isSupplier, parseDims, str, summary } from "@/lib/server";
import { createRequest, listRequests } from "@/lib/store";
import type { Photo } from "@/lib/types";

const MAX_PHOTO_CHARS = 1_500_000; // ca 1,1 MB per bild efter nedskalning i webbläsaren

export async function GET(req: Request) {
  if (!isSupplier(req)) return bad("unauthorized", 401);
  const all = await listRequests();
  return NextResponse.json(all.map(summary).reverse());
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("invalid json");
  }
  if (!isShape(body.shape)) return bad("shape");
  const dims = parseDims(body.shape, body.dims, "customer");
  if (!dims) return bad("dims");

  const contact = (body.contact ?? {}) as Record<string, unknown>;
  const name = str(contact.name, 120);
  const email = str(contact.email, 200);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("contact");

  const photos: Photo[] = [];
  for (const p of Array.isArray(body.photos) ? body.photos.slice(0, 4) : []) {
    const url = (p as Photo)?.dataUrl;
    const view = (p as Photo)?.view;
    if (typeof url !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(url)) return bad("photo");
    if (url.length > MAX_PHOTO_CHARS) return bad("photo too large", 413);
    photos.push({ view: view === "front" || view === "side" ? view : "other", dataUrl: url });
  }
  if (!photos.length) return bad("photo");

  const shape = body.shape;
  const now = new Date().toISOString();
  const created = await createRequest((projectNo) => ({
    id: randomUUID(),
    projectNo,
    createdAt: now,
    revision: 1,
    status: "new",
    shape,
    unit: body.unit === "in" ? "in" : "cm",
    dims,
    readiness: readiness(shape, dims),
    photos,
    color: /^#[0-9a-f]{6}$/i.test(str(body.color, 7)) ? str(body.color, 7) : "#3d6b5f",
    notes: str(body.notes, 2000),
    contact: { name, email, country: str(contact.country, 80), company: str(contact.company, 120) || undefined },
    messages: [],
    history: [{ at: now, rev: 1, event: "Förfrågan skapad av kund" }],
  }));
  return NextResponse.json({ id: created.id, projectNo: created.projectNo }, { status: 201 });
}
