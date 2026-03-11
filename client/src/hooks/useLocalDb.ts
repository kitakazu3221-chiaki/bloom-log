import { useCallback, useMemo } from "react";
import type { ScalpArea, NoteData, PhotoRecord } from "../types";
import { v4 as uuidv4 } from "uuid";

const DB_NAME = "bloom-log";
const DB_VERSION = 1;
const RECORDS_STORE = "records";
const PHOTOS_STORE = "photos";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(RECORDS_STORE)) {
        db.createObjectStore(RECORDS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        db.createObjectStore(PHOTOS_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGet<T>(db: IDBDatabase, store: string, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function dbGetAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function dbPut(db: IDBDatabase, store: string, value: unknown, key?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    if (key !== undefined) {
      tx.objectStore(store).put(value, key);
    } else {
      tx.objectStore(store).put(value);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function dbDelete(db: IDBDatabase, store: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function useLocalDb() {
  const saveCapture = useCallback(
    async (dataUrl: string, area: ScalpArea, notes: NoteData): Promise<PhotoRecord> => {
      const db = await openDb();
      const now = new Date();
      const id = uuidv4();
      const date = now.toISOString().slice(0, 10);
      const timePart = now.toISOString().slice(11, 19).replace(/:/g, "");
      const filename = `${date}T${timePart}_${area}.jpg`;
      const record: PhotoRecord = { id, date, area, filename, notes };
      await dbPut(db, RECORDS_STORE, record);
      await dbPut(db, PHOTOS_STORE, dataUrl, id);
      db.close();
      return record;
    },
    []
  );

  const loadRecords = useCallback(async (): Promise<PhotoRecord[]> => {
    const db = await openDb();
    const records = await dbGetAll<PhotoRecord>(db, RECORDS_STORE);
    db.close();
    return records;
  }, []);

  const loadPhotoUrl = useCallback(
    async (_area: ScalpArea, _filename: string, id?: string): Promise<string | null> => {
      if (!id) return null;
      const db = await openDb();
      const dataUrl = await dbGet<string>(db, PHOTOS_STORE, id);
      db.close();
      return dataUrl ?? null;
    },
    []
  );

  const deletePhoto = useCallback(async (id: string): Promise<void> => {
    const db = await openDb();
    await dbDelete(db, RECORDS_STORE, id);
    await dbDelete(db, PHOTOS_STORE, id);
    db.close();
  }, []);

  return useMemo(
    () => ({ saveCapture, loadRecords, loadPhotoUrl, deletePhoto }),
    [saveCapture, loadRecords, loadPhotoUrl, deletePhoto]
  );
}
