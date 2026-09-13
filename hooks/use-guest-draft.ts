"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Design } from "@/lib/design";
import { readGuestDrafts, writeGuestDraft, type GuestDraft } from "@/lib/guest-drafts";

type DraftStatus = "idle" | "saving" | "saved" | "error";
export function useGuestDraft({ enabled, design, dirty, sourceSlug }: { enabled: boolean; design: Design; dirty: boolean; sourceSlug?: string }) {
  const latest = useRef({ enabled, design, dirty, sourceSlug });
  const workspace = useRef<{ id?: string; parentId?: string; parentRevision?: string }>({});
  const durable = useRef<Design | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [drafts, setDrafts] = useState<GuestDraft[]>([]);
  const [status, setStatus] = useState<DraftStatus>("idle");
  const [workspaceId, setWorkspaceId] = useState<string | undefined>();
  const [lastSavedDesign, setLastSavedDesign] = useState<Design | null>(null);
  useEffect(() => { latest.current = { enabled, design, dirty, sourceSlug }; }, [enabled, design, dirty, sourceSlug]);
  const refreshDrafts = useCallback(() => {
    try { setDrafts(readGuestDrafts()); return true; } catch { setStatus("error"); return false; }
  }, []);
  const persist = useCallback((value: Design, hasChanges: boolean) => {
    if (!latest.current.enabled) return false;
    try {
      workspace.current.id ??= crypto.randomUUID();
      setWorkspaceId(workspace.current.id);
      writeGuestDraft({ ...workspace.current, id: workspace.current.id, design: value, hasChanges, sourceSlug: latest.current.sourceSlug });
      durable.current = value;
      setLastSavedDesign(value);
      setStatus("saved");
      refreshDrafts();
      return true;
    } catch { setStatus("error"); return false; }
  }, [refreshDrafts]);
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const value = latest.current;
    if (!value.enabled || !value.dirty || durable.current === value.design) return true;
    return persist(value.design, true);
  }, [persist]);
  const beginWorkspace = useCallback((parent?: GuestDraft) => {
    clearTimeout(timer.current);
    workspace.current = { parentId: parent?.id, parentRevision: parent?.revision };
    durable.current = null;
    setWorkspaceId(undefined);
    setLastSavedDesign(null);
    setStatus("idle");
  }, []);
  const checkpoint = useCallback((saved: Design) => {
    clearTimeout(timer.current);
    return persist(saved, false);
  }, [persist]);
  const retry = useCallback(() => {
    if (latest.current.dirty) {
      durable.current = null;
      return flush();
    }
    if (!refreshDrafts()) return false;
    setStatus("idle");
    return true;
  }, [flush, refreshDrafts]);
  useEffect(() => {
    if (!enabled) return;
    const initialRefresh = window.setTimeout(refreshDrafts, 0);
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === `bead-atelier:guest:draft:v1:${workspace.current.id}`) {
        durable.current = null;
        flush();
      }
      refreshDrafts();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearTimeout(initialRefresh);
      flush();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
  }, [enabled, flush, refreshDrafts]);
  useEffect(() => {
    if (!enabled || !dirty || durable.current === design) return;
    timer.current = setTimeout(flush, 650);
    return () => clearTimeout(timer.current);
  }, [enabled, design, dirty, flush]);
  const visibleStatus = enabled && dirty && lastSavedDesign !== design && status !== "error" ? "saving" : status;
  return { drafts: drafts.filter(draft => draft.id !== workspaceId), currentDraft: drafts.find(draft => draft.id === workspaceId), status: visibleStatus, flush, retry, beginWorkspace, checkpoint };
}
