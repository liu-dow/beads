import type { Design } from "@/lib/design";
import { designSchema } from "@/lib/design-schema";

const DESIGNS_KEY = "bead-atelier:guest:designs:v1";
const EXPORTS_KEY = "bead-atelier:guest:exports:v1";

type GuestExport = { format: "png" | "pdf"; createdAt: string };

function storage() {
  if (typeof window === "undefined") throw new Error("Local storage is unavailable.");
  return window.localStorage;
}

export function loadGuestDesigns(strict = false): Design[] {
  try {
    const value: unknown = JSON.parse(storage().getItem(DESIGNS_KEY) ?? "[]");
    if (!Array.isArray(value)) throw new Error("Invalid saved collection.");
    return value.flatMap(item => {
      const parsed = designSchema.safeParse(item);
      if (strict && (!parsed.success || !parsed.data.id)) throw new Error("Invalid saved design.");
      return parsed.success && parsed.data.id ? [parsed.data] : [];
    }).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,100);
  } catch { if (strict) throw new Error("Your saved collection could not be read. It has been left unchanged."); return []; }
}

export function saveGuestDesign(design: Design) {
  const now = new Date().toISOString();
  const saved = { ...design, id: design.id || crypto.randomUUID(), createdAt: design.id ? design.createdAt : now, updatedAt: now };
  const parsed = designSchema.safeParse(saved);
  if (!parsed.success) throw new Error("Check the title, author, and pattern dimensions.");
  const designs = loadGuestDesigns(true).filter(item=>item.id!==saved.id);
  storage().setItem(DESIGNS_KEY, JSON.stringify([parsed.data,...designs].slice(0,100)));
  return parsed.data;
}

export function recordGuestExport(format: "png" | "pdf") {
  let events: GuestExport[] = [];
  try {
    const value: unknown = JSON.parse(storage().getItem(EXPORTS_KEY) ?? "[]");
    if (Array.isArray(value)) events = value.filter((item):item is GuestExport=>!!item && typeof item === "object" && ((item as GuestExport).format === "png" || (item as GuestExport).format === "pdf"));
  } catch { /* Start a clean local export history. */ }
  storage().setItem(EXPORTS_KEY,JSON.stringify([{format,createdAt:new Date().toISOString()},...events].slice(0,1000)));
}

export function guestStats(designs = loadGuestDesigns()) {
  let events: GuestExport[] = [];
  try {
    const value: unknown = JSON.parse(storage().getItem(EXPORTS_KEY) ?? "[]");
    if (Array.isArray(value)) events = value.filter((item):item is GuestExport=>!!item && typeof item === "object" && ((item as GuestExport).format === "png" || (item as GuestExport).format === "pdf"));
  } catch { /* Invalid local history contributes no statistics. */ }
  const authors = new Map<string,{name:string;count:number;beads:number}>();
  for (const design of designs) {
    const value=authors.get(design.author)??{name:design.author,count:0,beads:0};
    value.count++;value.beads+=design.cells.length;authors.set(design.author,value);
  }
  return {
    designs:{count:designs.length,beads:designs.reduce((total,design)=>total+design.cells.length,0)},
    exports:["png","pdf"].map(format=>({format,count:events.filter(event=>event.format===format).length})),
    authors:[...authors.values()].sort((a,b)=>b.count-a.count),
  };
}
