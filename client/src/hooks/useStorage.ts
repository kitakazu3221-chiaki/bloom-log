import { useCallback, useMemo } from "react";
import type { ScalpArea, NoteData, PhotoRecord } from "../types";
import { useLocalDb } from "./useLocalDb";

export interface UseStorageReturn {
  isReady: true;
  directoryName: null;
  dirHandle: null;
  selectDirectory: () => Promise<void>;
  saveCapture: (
    dataUrl: string,
    area: ScalpArea,
    notes: NoteData
  ) => Promise<PhotoRecord>;
  loadRecords: () => Promise<PhotoRecord[]>;
  loadPhotoUrl: (area: ScalpArea, filename: string, id?: string) => Promise<string | null>;
  deletePhoto: (id: string) => Promise<void>;
}

export function useStorage(mode: "cloud" | "local" = "cloud"): UseStorageReturn {
  const localDb = useLocalDb();

  const selectDirectory = useCallback(async () => {}, []);

  // ── Cloud methods ──
  const cloudSave = useCallback(
    async (dataUrl: string, area: ScalpArea, notes: NoteData): Promise<PhotoRecord> => {
      const res = await fetch("/api/photos/upload", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, area, notes }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "保存に失敗しました");
      }
      return res.json() as Promise<PhotoRecord>;
    },
    []
  );

  const cloudLoadRecords = useCallback(async (): Promise<PhotoRecord[]> => {
    const res = await fetch("/api/photos/records", { credentials: "include" });
    if (!res.ok) return [];
    const data = (await res.json()) as { records: PhotoRecord[] };
    return data.records ?? [];
  }, []);

  const cloudLoadPhotoUrl = useCallback(
    async (area: ScalpArea, filename: string): Promise<string | null> => {
      return `/api/photos/file/${encodeURIComponent(area)}/${encodeURIComponent(filename)}`;
    },
    []
  );

  const cloudDeletePhoto = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/photos/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? "削除に失敗しました");
    }
  }, []);

  // ── Select based on mode ──
  return useMemo(() => ({
    isReady: true as const,
    directoryName: null,
    dirHandle: null,
    selectDirectory,
    saveCapture: mode === "local" ? localDb.saveCapture : cloudSave,
    loadRecords: mode === "local" ? localDb.loadRecords : cloudLoadRecords,
    loadPhotoUrl: mode === "local" ? localDb.loadPhotoUrl : cloudLoadPhotoUrl,
    deletePhoto: mode === "local" ? localDb.deletePhoto : cloudDeletePhoto,
  }), [mode, selectDirectory, localDb, cloudSave, cloudLoadRecords, cloudLoadPhotoUrl, cloudDeletePhoto]);
}
