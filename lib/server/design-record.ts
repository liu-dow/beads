import type { Design } from "@/lib/design";

export type DesignRecord = { id: string; data: Design; created_at: string; updated_at: string };
export function fromRecord(row: DesignRecord): Design {
  return { ...row.data, id: row.id, createdAt: row.created_at, updatedAt: row.updated_at };
}
export function designPayload(design: Design) {
  // The DB owns identity and timestamps; client metadata cannot change them.
  const { id, createdAt, updatedAt, ...data } = design;
  void [id, createdAt, updatedAt];
  return data;
}
