import { TenderRecord, DatasetMeta } from '../types/tender';

const DB_NAME = 'TenderSearchAppDB';
const DB_VERSION = 1;
const STORE_RECORDS = 'records';
const STORE_META = 'metadata';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        db.createObjectStore(STORE_RECORDS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDatasetToIndexedDB(
  records: TenderRecord[],
  meta: DatasetMeta
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_RECORDS, STORE_META], 'readwrite');
    const recordsStore = tx.objectStore(STORE_RECORDS);
    const metaStore = tx.objectStore(STORE_META);

    // Clear old records first
    recordsStore.clear();

    // Insert all records
    for (const record of records) {
      recordsStore.put(record);
    }

    // Save meta
    metaStore.put({ key: 'current_meta', ...meta });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadDatasetFromIndexedDB(): Promise<{
  records: TenderRecord[];
  meta: DatasetMeta | null;
} | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_RECORDS, STORE_META], 'readonly');
      const recordsStore = tx.objectStore(STORE_RECORDS);
      const metaStore = tx.objectStore(STORE_META);

      const recordsReq = recordsStore.getAll();
      const metaReq = metaStore.get('current_meta');

      tx.oncomplete = () => {
        const records = recordsReq.result || [];
        const meta = metaReq.result || null;
        if (records.length === 0) {
          resolve(null);
        } else {
          resolve({ records, meta });
        }
      };

      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to load from IndexedDB:', err);
    return null;
  }
}

export async function clearIndexedDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_RECORDS, STORE_META], 'readwrite');
    tx.objectStore(STORE_RECORDS).clear();
    tx.objectStore(STORE_META).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
