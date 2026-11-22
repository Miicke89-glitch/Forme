import { promises as fs } from "node:fs";
import path from "node:path";
import type { FormeRequest } from "./types";

/**
 * MVP-lagring: en JSON-fil på servern. Gränssnittet är avsiktligt litet så att
 * det kan bytas mot Supabase/PostgreSQL utan att röra resten av koden.
 */
const dir = () => path.resolve(/*turbopackIgnore: true*/ process.env.FORME_DATA_DIR || ".data");
const file = () => path.join(dir(), "requests.json");

let queue: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function readAll(): Promise<FormeRequest[]> {
  try {
    return JSON.parse(await fs.readFile(file(), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

async function writeAll(all: FormeRequest[]) {
  await fs.mkdir(dir(), { recursive: true });
  const tmp = file() + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(all));
  await fs.rename(tmp, file());
}

export const listRequests = () => locked(readAll);

export const getRequest = (id: string) =>
  locked(async () => (await readAll()).find((r) => r.id === id) ?? null);

export const createRequest = (build: (projectNo: string) => FormeRequest) =>
  locked(async () => {
    const all = await readAll();
    const year = new Date().getFullYear();
    const n = all.filter((r) => r.projectNo.startsWith(`FM-${year}-`)).length + 1;
    const req = build(`FM-${year}-${String(n).padStart(4, "0")}`);
    all.push(req);
    await writeAll(all);
    return req;
  });

/** Uppdaterar atomärt. Kasta ett fel i `mutate` för att avbryta. */
export const updateRequest = (id: string, mutate: (r: FormeRequest) => void) =>
  locked(async () => {
    const all = await readAll();
    const req = all.find((r) => r.id === id);
    if (!req) return null;
    mutate(req);
    await writeAll(all);
    return req;
  });
