import { useState, useCallback, useMemo, useRef } from "react";
import type { ScalpArea, NoteData, PhotoRecord } from "../types";
import { v4 as uuidv4 } from "uuid";

const FS_HANDLE_KEY = "bloom-log-fs-handle";

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function getOrCreateSubDir(
  parent: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemDirectoryHandle> {
  return parent.getDirectoryHandle(name, { create: true });
}

async function readJsonFile<T>(dir: FileSystemDirectoryHandle, name: string): Promise<T | null> {
  try {
    const fh = await dir.getFileHandle(name);
    const file = await fh.getFile();
    const text = await file.text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function writeJsonFile(dir: FileSystemDirectoryHandle, name: string, data: unknown): Promise<void> {
  const fh = await dir.getFileHandle(name, { create: true });
  const writable = await fh.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

interface RecordsJson {
  records: PhotoRecord[];
}

export function useFileSystemStorage() {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const dirHandleRef = useRef<FileSystemDirectoryHandle | null>(null);

  // Try to restore saved handle on first use
  const restoreHandle = useCallback(async (): Promise<FileSystemDirectoryHandle | null> => {
    if (dirHandleRef.current) return dirHandleRef.current;
    try {
      // Try IndexedDB-stored handle
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("bloom-log-fs", 1);
        req.onupgradeneeded = () => {
          req.result.createObjectStore("handles");
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const tx = db.transaction("handles", "readonly");
      const stored = await new Promise<FileSystemDirectoryHandle | undefined>((resolve, reject) => {
        const r = tx.objectStore("handles").get(FS_HANDLE_KEY);
        r.onsuccess = () => resolve(r.result as FileSystemDirectoryHandle | undefined);
        r.onerror = () => reject(r.error);
      });
      db.close();

      if (stored) {
        // Verify permission
        const perm = await (stored as any).queryPermission({ mode: "readwrite" });
        if (perm === "granted") {
          dirHandleRef.current = stored;
          setDirHandle(stored);
          setDirectoryName(stored.name);
          return stored;
        }
        // Try to request permission
        const req = await (stored as any).requestPermission({ mode: "readwrite" });
        if (req === "granted") {
          dirHandleRef.current = stored;
          setDirHandle(stored);
          setDirectoryName(stored.name);
          return stored;
        }
      }
    } catch {
      // Silently fail
    }
    return null;
  }, []);

  const saveHandleToIdb = useCallback(async (handle: FileSystemDirectoryHandle) => {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("bloom-log-fs", 1);
        req.onupgradeneeded = () => {
          req.result.createObjectStore("handles");
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const tx = db.transaction("handles", "readwrite");
      tx.objectStore("handles").put(handle, FS_HANDLE_KEY);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch {
      // Non-critical
    }
  }, []);

  const selectDirectory = useCallback(async () => {
    const handle = await window.showDirectoryPicker!({ mode: "readwrite" });
    dirHandleRef.current = handle;
    setDirHandle(handle);
    setDirectoryName(handle.name);
    await saveHandleToIdb(handle);
  }, [saveHandleToIdb]);

  const getHandle = useCallback(async (): Promise<FileSystemDirectoryHandle> => {
    if (dirHandleRef.current) return dirHandleRef.current;
    const restored = await restoreHandle();
    if (restored) return restored;
    throw new Error("NO_DIRECTORY");
  }, [restoreHandle]);

  const saveCapture = useCallback(
    async (dataUrl: string, area: ScalpArea, notes: NoteData): Promise<PhotoRecord> => {
      const root = await getHandle();
      const bloomDir = await getOrCreateSubDir(root, "bloom-log");
      const areaDir = await getOrCreateSubDir(bloomDir, area);

      const now = new Date();
      const id = uuidv4();
      const date = now.toISOString().slice(0, 10);
      const timePart = now.toISOString().slice(11, 19).replace(/:/g, "");
      const filename = `${date}T${timePart}_${area}.jpg`;

      // Write photo file
      const photoHandle = await areaDir.getFileHandle(filename, { create: true });
      const writable = await photoHandle.createWritable();
      await writable.write(dataUrlToBlob(dataUrl));
      await writable.close();

      // Update records.json
      const record: PhotoRecord = { id, date, area, filename, notes };
      const existing = await readJsonFile<RecordsJson>(bloomDir, "records.json");
      const records = existing?.records ?? [];
      records.push(record);
      await writeJsonFile(bloomDir, "records.json", { records });

      return record;
    },
    [getHandle]
  );

  const loadRecords = useCallback(async (): Promise<PhotoRecord[]> => {
    const root = await getHandle();
    const bloomDir = await getOrCreateSubDir(root, "bloom-log");
    const data = await readJsonFile<RecordsJson>(bloomDir, "records.json");
    return data?.records ?? [];
  }, [getHandle]);

  const loadPhotoUrl = useCallback(
    async (area: ScalpArea, filename: string): Promise<string | null> => {
      try {
        const root = await getHandle();
        const bloomDir = await getOrCreateSubDir(root, "bloom-log");
        const areaDir = await getOrCreateSubDir(bloomDir, area);
        const fh = await areaDir.getFileHandle(filename);
        const file = await fh.getFile();
        return URL.createObjectURL(file);
      } catch {
        return null;
      }
    },
    [getHandle]
  );

  const deletePhoto = useCallback(
    async (id: string): Promise<void> => {
      const root = await getHandle();
      const bloomDir = await getOrCreateSubDir(root, "bloom-log");
      const data = await readJsonFile<RecordsJson>(bloomDir, "records.json");
      if (!data) return;

      const record = data.records.find((r) => r.id === id);
      if (record) {
        // Delete file
        try {
          const areaDir = await getOrCreateSubDir(bloomDir, record.area);
          await areaDir.removeEntry(record.filename);
        } catch {
          // File might not exist
        }
      }

      // Update records.json
      data.records = data.records.filter((r) => r.id !== id);
      await writeJsonFile(bloomDir, "records.json", data);
    },
    [getHandle]
  );

  const isReady = dirHandle !== null;

  return useMemo(
    () => ({
      isReady,
      dirHandle,
      directoryName,
      selectDirectory,
      restoreHandle,
      saveCapture,
      loadRecords,
      loadPhotoUrl,
      deletePhoto,
    }),
    [isReady, dirHandle, directoryName, selectDirectory, restoreHandle, saveCapture, loadRecords, loadPhotoUrl, deletePhoto]
  );
}
