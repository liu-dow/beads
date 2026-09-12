import { z } from "zod";
import { designSchema } from "./design-schema";
import type { Design } from "./design";

const PREFIX = "bead-atelier:guest:draft:v1:";
const draftSchema = z.object({
  id: z.string().uuid(), parentId: z.string().uuid().optional(),
  revision: z.string().uuid().optional(), parentRevision: z.string().uuid().optional(),
  design: designSchema, sourceSlug: z.string().max(80).optional(),
  hasChanges: z.boolean(), savedAt: z.string().datetime(),
});
export type GuestDraft = z.infer<typeof draftSchema>;

export function readGuestDrafts(): GuestDraft[] {
  const local = window.localStorage, drafts: GuestDraft[] = [];
  for (let i = 0; i < local.length; i++) {
    const key = local.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    try {
      const parsed = draftSchema.safeParse(JSON.parse(local.getItem(key) ?? "null"));
      if (parsed.success && key === PREFIX + parsed.data.id) drafts.push(parsed.data);
    } catch { /* One damaged draft must not hide the other recoverable designs. */ }
  }
  // Each editing session writes its own key. A resumed draft remains recoverable
  // underneath its newer branch; simultaneous tabs cannot overwrite one another.
  return drafts.filter(parent => !drafts.some(child => child.parentId === parent.id && parent.revision && child.parentRevision === parent.revision))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function writeGuestDraft(input: { id: string; parentId?: string; parentRevision?: string; design: Design; sourceSlug?: string; hasChanges: boolean }): GuestDraft {
  const draft = draftSchema.parse({ ...input, revision: crypto.randomUUID(), savedAt: new Date().toISOString() });
  if (draft.id === draft.parentId) throw new Error("A draft cannot replace its own recovery source.");
  window.localStorage.setItem(PREFIX + draft.id, JSON.stringify(draft));
  return draft;
}
