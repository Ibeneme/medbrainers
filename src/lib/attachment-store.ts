/**
 * attachment-store.ts
 *
 * Browser-side storage for the files attached to a consultation form.
 *
 * Why IndexedDB: File/Blob objects can't go into localStorage (strings only,
 * ~5 MB limit). IndexedDB stores real Blobs, so images and PDFs survive a
 * refresh, a closed tab or coming back later.
 *
 * Files are grouped into "buckets", e.g.
 *   autosave_<patientId>   -> the automatic autosave
 *   draft_<draftId>        -> one saved draft
 *
 * Suggested location: src/lib/attachment-store.ts
 * (import it as "@/lib/attachment-store")
 */

const DB_NAME = "emr-consultation-attachments";
const STORE = "buckets";

type StoredFile = {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  blob: Blob;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | undefined> {
  const db = await openDb();
  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(req ? (req as IDBRequest<T>).result : undefined);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error("IndexedDB transaction aborted"));
    };
  });
}

/** Replace everything stored in `bucket` with `files` (empty array = clear). */
export async function saveAttachments(
  bucket: string,
  files: File[]
): Promise<void> {
  if (files.length === 0) {
    await run("readwrite", (s) => {
      s.delete(bucket);
    });
    return;
  }
  const records: StoredFile[] = files.map((f) => ({
    name: f.name,
    type: f.type,
    size: f.size,
    lastModified: f.lastModified,
    blob: f,
  }));
  await run("readwrite", (s) => {
    s.put(records, bucket);
  });
}

/** Read the files saved in `bucket` back as real File objects. */
export async function loadAttachments(bucket: string): Promise<File[]> {
  const records = (await run<StoredFile[]>("readonly", (s) =>
    s.get(bucket)
  )) as StoredFile[] | undefined;
  if (!records || !Array.isArray(records)) return [];
  return records.map(
    (r) =>
      new File([r.blob], r.name, {
        type: r.type,
        lastModified: r.lastModified,
      })
  );
}

/** Remove a bucket (call when a draft is deleted or the consultation is submitted). */
export async function deleteAttachments(bucket: string): Promise<void> {
  await run("readwrite", (s) => {
    s.delete(bucket);
  });
}