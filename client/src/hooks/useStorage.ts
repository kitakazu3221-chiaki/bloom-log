import { useCallback, useMemo, useEffect } from "react";
import type { ScalpArea, NoteData, PhotoRecord } from "../types";
import { useLocalDb } from "./useLocalDb";
import { useFileSystemStorage } from "./useFileSystemStorage";
import { useI18n } from "./useI18n";

export type StorageMode = "cloud" | "local" | "filesystem";

export interface UseStorageReturn {
  isReady: boolean;
  directoryName: string | null;
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

export function useStorage(mode: StorageMode = "cloud"): UseStorageReturn {
  const { t } = useI18n();
  const localDb = useLocalDb();
  const fs = useFileSystemStorage();

  // Auto-restore filesystem handle when mode is filesystem
  useEffect(() => {
    if (mode === "filesystem" && !fs.isReady) {
      fs.restoreHandle();
    }
  }, [mode, fs.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

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
        throw new Error(err.error ?? t["pc.saveFailed"]);
      }
      return res.json() as Promise<PhotoRecord>;
    },
    [t]
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
      throw new Error(err.error ?? t["history.deleteFailed"]);
    }
  }, [t]);

  // ── Select based on mode ──
  return useMemo(() => {
    if (mode === "filesystem") {
      return {
        isReady: fs.isReady,
        directoryName: fs.directoryName,
        selectDirectory: fs.selectDirectory,
        saveCapture: fs.saveCapture,
        loadRecords: fs.loadRecords,
        loadPhotoUrl: fs.loadPhotoUrl,
        deletePhoto: fs.deletePhoto,
      };
    }

    const noop = async () => {};
    return {
      isReady: true,
      directoryName: null,
      selectDirectory: noop,
      saveCapture: mode === "local" ? localDb.saveCapture : cloudSave,
      loadRecords: mode === "local" ? localDb.loadRecords : cloudLoadRecords,
      loadPhotoUrl: mode === "local" ? localDb.loadPhotoUrl : cloudLoadPhotoUrl,
      deletePhoto: mode === "local" ? localDb.deletePhoto : cloudDeletePhoto,
    };
  }, [mode, fs, localDb, cloudSave, cloudLoadRecords, cloudLoadPhotoUrl, cloudDeletePhoto]);
}
