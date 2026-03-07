import { useCallback } from "react";
import type { ScalpArea, NoteData, PhotoRecord } from "../types";

// Storage is now fully server-side.
// Photos are uploaded to / fetched from Express via /api/photos/*.
// No folder selection or File System Access API required.

interface UseStorageReturn {
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
  loadPhotoUrl: (area: ScalpArea, filename: string) => Promise<string | null>;
}

export function useStorage(): UseStorageReturn {
  // No-op: server handles storage
  const selectDirectory = useCallback(async () => {}, []);

  const saveCapture = useCallback(
    async (
      dataUrl: string,
      area: ScalpArea,
      notes: NoteData
    ): Promise<PhotoRecord> => {
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

  const loadRecords = useCallback(async (): Promise<PhotoRecord[]> => {
    const res = await fetch("/api/photos/records", { credentials: "include" });
    if (!res.ok) return [];
    const data = (await res.json()) as { records: PhotoRecord[] };
    return data.records ?? [];
  }, []);

  // Returns the API URL directly — browser sends cookies automatically on
  // same-origin requests, so <img src={url}> works without extra fetch calls.
  const loadPhotoUrl = useCallback(
    async (area: ScalpArea, filename: string): Promise<string | null> => {
      return `/api/photos/file/${encodeURIComponent(area)}/${encodeURIComponent(filename)}`;
    },
    []
  );

  return {
    isReady: true,
    directoryName: null,
    dirHandle: null,
    selectDirectory,
    saveCapture,
    loadRecords,
    loadPhotoUrl,
  };
}
