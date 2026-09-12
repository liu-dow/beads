import type { BeadColor, Design } from "./design";
import { COLORWAYS, type ColorwayId } from "./portfolio";

export function starterPaletteId(design: Design, original: BeadColor[]): ColorwayId | "" {
  return COLORWAYS.find(option => design.palette.every((color, index) => {
    const initial = original.find(item => item.id === color.id);
    const hex = option.id === "original" ? initial?.hex : option.colors[index]?.[1] ?? initial?.hex;
    return color.hex.toLowerCase() === hex?.toLowerCase();
  }))?.id ?? "";
}

export function applyStarterPalette(design: Design, original: BeadColor[], id: ColorwayId): Design {
  const option = COLORWAYS.find(item => item.id === id)!;
  return { ...design, palette: design.palette.map((color, index) => {
    if (id === "original") return { ...(original.find(item => item.id === color.id) ?? color) };
    const value = option.colors[index];
    return value ? { id: color.id, name: value[0], hex: value[1], finish: color.finish } : color;
  }) };
}
