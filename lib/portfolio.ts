import { createDesign, materialCounts, type Design, type Preset } from "./design";

export const PORTFOLIO_CATEGORIES = ["All designs", "Geometric", "Botanical", "Minimal"] as const;
export type PortfolioCategory = Exclude<typeof PORTFOLIO_CATEGORIES[number], "All designs">;
export type PublicWork = {
  slug: string; title: string; category: PortfolioCategory; description: string;
  story: string; preset: Preset; background: string; accent: string;
  colors: [string, string][]; rows: number; cols: number;
};

// Intentionally published studio studies. Private and device-local work is never queried here.
export const PUBLIC_WORKS: readonly PublicWork[] = [
  { slug: "tidal-rhythm", title: "Tidal Rhythm", category: "Geometric", preset: "coast", rows: 22, cols: 112,
    background: "#dce6e2", accent: "#284e50",
    description: "Turquoise diamonds, quiet ivory, and a thread of gold. A peyote bracelet pattern inspired by the changing tide.",
    story: "Repeating diamonds stretch across the band like light on water. The ivory centres give the eye a place to rest, while gold outlines hold the rhythm together. Try a softer blue for a quieter variation.",
    colors: [["Obsidian", "#202729"], ["Lagoon", "#369caa"], ["Deep sea", "#254d63"], ["Champagne", "#c9a45c"], ["Ivory", "#eff1e5"], ["Sea glass", "#98d9d5"]] },
  { slug: "midnight-prism", title: "Midnight Prism", category: "Geometric", preset: "nocturne", rows: 22, cols: 112,
    background: "#d8dde5", accent: "#303e58",
    description: "Luminous blue diamonds on an ink-dark ground. An even-count peyote pattern with a precise metallic outline.",
    story: "A dark ground turns each diamond into a small pool of light. The repeated motif is easy to follow as a sequence, and its narrow gold lines make small colour changes feel dramatic.",
    colors: [["Ink", "#222839"], ["Sapphire", "#427cae"], ["Slate", "#415c7e"], ["Antique gold", "#bd9653"], ["Ivory", "#eee8d8"], ["Ice", "#c2dded"]] },
  { slug: "wildflower-study", title: "Wildflower Study", category: "Botanical", preset: "bloom", rows: 22, cols: 112,
    background: "#eddfdf", accent: "#765154",
    description: "Small, vivid blossoms arranged on a charcoal band. A floral beadwork pattern for playing with colour.",
    story: "Petals alternate between rose, lilac, orange, and blue. Keep the centres in a single gold to connect the flowers, or replace every petal with one colour for a more restrained garden.",
    colors: [["Charcoal", "#292b30"], ["Cornflower", "#729ba5"], ["Slate", "#456074"], ["Pollen", "#d7b367"], ["Ivory", "#efeee1"], ["Mint", "#a4cbbb"], ["Marigold", "#de974c"], ["Lilac", "#aa91be"], ["Rose", "#d196a6"]] },
  { slug: "northern-lights", title: "Northern Lights", category: "Minimal", preset: "aurora", rows: 18, cols: 112,
    background: "#dedfe9", accent: "#55566b",
    description: "Fine bands of colour and scattered light on a dark field. A minimal peyote bracelet with an open, spacious rhythm.",
    story: "Two quiet colour bands frame a field of small light points. Negative space is the subject here: leave the dark beads in place and experiment with the brightest accents.",
    colors: [["Night", "#252736"], ["Aurora", "#79b3ac"], ["Twilight", "#7975a7"], ["Gold", "#bd9d64"], ["Starlight", "#eee6d5"], ["Glacier", "#b7dbcb"], ["Dawn", "#cc926f"]] },
  { slug: "terracotta-tide", title: "Terracotta Tide", category: "Geometric", preset: "coast", rows: 18, cols: 96,
    background: "#ebded0", accent: "#84543c",
    description: "A warm geometric bead pattern in terracotta, clay, and cream, outlined with muted brass.",
    story: "The same diamond rhythm takes on a warmer character in earth tones. Cream opens up the centre of the motif; deeper clay brings the edges forward. This narrower band uses eighteen rows.",
    colors: [["Umber", "#583b31"], ["Terracotta", "#b7654c"], ["Burnt clay", "#824634"], ["Brass", "#b99561"], ["Cream", "#eedfc8"], ["Blush", "#d4a78b"]] },
  { slug: "ivory-garden", title: "Ivory Garden", category: "Botanical", preset: "bloom", rows: 22, cols: 98,
    background: "#e3e5d9", accent: "#52634c",
    description: "Green and blue flowers on a soft ivory ground. A light, botanical colour study for a peyote bracelet.",
    story: "An ivory background changes the mood of the floral repeat entirely. The green petals feel leaf-like, and the occasional blue flower breaks up the sequence without overpowering it.",
    colors: [["Ivory", "#edead8"], ["Sage", "#759879"], ["Blue", "#7594a5"], ["Ochre", "#b99a5a"], ["Chalk", "#f6f0e2"], ["Mint", "#a7bba0"], ["Olive", "#8f975b"], ["Periwinkle", "#8695aa"], ["Fern", "#557c69"]] },
  { slug: "silver-hour", title: "Silver Hour", category: "Geometric", preset: "nocturne", rows: 18, cols: 112,
    background: "#e2e4e3", accent: "#505c5e",
    description: "A monochrome diamond bracelet in graphite, silver, and mist. A study in contrast and reflective finishes.",
    story: "Taking away saturated colour lets the structure lead. Alternate reflective silver with a matte ground to bring depth to this restrained pattern, or use all matte beads for a graphic finish.",
    colors: [["Graphite", "#373d40"], ["Pewter", "#899698"], ["Smoke", "#5e696c"], ["Silver", "#c0c7c5"], ["White", "#f2f3ee"], ["Mist", "#dce1df"]] },
  { slug: "desert-signal", title: "Desert Signal", category: "Minimal", preset: "aurora", rows: 18, cols: 96,
    background: "#e8dfd5", accent: "#796147",
    description: "Fine ochre, coral, and cream accents set into a deep brown bracelet. A spare, warm-toned peyote study.",
    story: "The pattern leaves room between its accents. Ochre and coral bring warmth to the edges, with small cream points drawing the eye along the centre of the band.",
    colors: [["Earth", "#48382f"], ["Ochre", "#c39349"], ["Clay", "#a86c4d"], ["Gold", "#bf9c60"], ["Sand", "#ecdabe"], ["Cream", "#d4b997"], ["Coral", "#cb806b"]] },
];

export function publicWork(slug: string) { return PUBLIC_WORKS.find(work => work.slug === slug); }
export const COLORWAYS = [
  { id: "original", name: "Original", colors: [] },
  { id: "moonlight", name: "Moonlight", colors: [["Midnight", "#222b39"], ["Silver blue", "#8499b4"], ["Slate", "#45586b"], ["Silver", "#bdc8d0"], ["Pearl", "#f0efeb"], ["Mist", "#c2dce0"], ["Dusk", "#9c93b1"], ["Lavender", "#b5aec4"], ["Blue grey", "#607d99"]] },
  { id: "rosewood", name: "Rosewood", colors: [["Cocoa", "#382c30"], ["Rose", "#c88f9a"], ["Wine", "#754653"], ["Warm gold", "#bd9b5f"], ["Cream", "#f0e5d6"], ["Blush", "#e0bdb4"], ["Apricot", "#d6a17a"], ["Mauve", "#ad829d"], ["Dusty rose", "#bd7284"]] },
  { id: "woodland", name: "Woodland", colors: [["Forest", "#233e35"], ["Leaf", "#7fa181"], ["Pine", "#466455"], ["Ochre", "#c1a368"], ["Linen", "#eee8d4"], ["Sage", "#bdcdb0"], ["Clay", "#c28d66"], ["Heather", "#a59baa"], ["Olive", "#999d62"]] },
] as const;
export type ColorwayId = typeof COLORWAYS[number]["id"];
export function colorwayId(value: unknown): ColorwayId {
  return COLORWAYS.find(item => item.id === value)?.id ?? "original";
}
export function coloredWork(work: PublicWork, value: ColorwayId = "original"): PublicWork {
  const variant = COLORWAYS.find(item => item.id === value)!;
  return value === "original" ? work : { ...work, colors: work.colors.map((_, i) => [...variant.colors[i]] as [string, string]) };
}
export function workDesign(work: PublicWork, colorway: ColorwayId = "original"): Design {
  work = coloredWork(work, colorway);
  const design = createDesign(work.preset, work.rows, work.cols);
  return { ...design, id: work.slug, title: work.title, author: "Bead Atelier", description: work.description,
    createdAt: "2026-09-09T00:00:00.000Z", updatedAt: "2026-09-09T00:00:00.000Z",
    palette: work.colors.map(([name, hex], i) => ({ id: String.fromCharCode(65 + i), name, hex, finish: i === 3 ? "metal" : i === 0 ? "matte" : "gloss" })) };
}
export function workPalette(work: PublicWork) { return materialCounts(workDesign(work)); }
export function remixWork(work: PublicWork, colorway: ColorwayId = "original"): Design {
  const now = new Date().toISOString();
  return { ...workDesign(work, colorway), id: "", title: `${work.title} — my variation`, author: "Guest creator", createdAt: now, updatedAt: now };
}
export function studioUrl(work: PublicWork, colorway: ColorwayId = "original") {
  return `/studio?design=${work.slug}${colorway === "original" ? "" : `&palette=${colorway}`}`;
}
export type GalleryQuery = { q?: string; category?: string; sort?: string };
export function filterWorks(query: GalleryQuery) {
  const words = (query.q ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  return PUBLIC_WORKS.filter(work => (!query.category || query.category === "All designs" || work.category === query.category)
    && words.every(word => `${work.title} ${work.description} ${work.category} ${workPalette(work).map(color => color.name).join(" ")}`.toLowerCase().includes(word)))
    .sort((a, b) => query.sort === "title" ? a.title.localeCompare(b.title, "en") : query.sort === "colors" ? workPalette(a).length - workPalette(b).length : 0);
}
export function galleryUrl(query: GalleryQuery) {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim().slice(0, 120));
  if (query.category && query.category !== "All designs") params.set("category", query.category);
  if (query.sort && query.sort !== "curated") params.set("sort", query.sort);
  return `/portfolio${params.size ? `?${params}` : ""}`;
}
