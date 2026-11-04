const DB_NAME = 'BungeoppangDB';
const OLD_STORE_NAME = 'videos';
const STORE_NAME = 'images';
const IMAGE_KEY = 'promoImage';

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // Prevent errors in environments where indexedDB is not available
    if (!window.indexedDB) {
        console.warn("IndexedDB not supported.");
        return reject("IndexedDB not supported");
    }

    const request = indexedDB.open(DB_NAME, 2); // Bump version to trigger upgrade
    request.onerror = () => reject("Error opening DB: " + request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (db.objectStoreNames.contains(OLD_STORE_NAME)) {
        db.deleteObjectStore(OLD_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const saveImage = (blob: Blob): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) return reject("DB not initialized");
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(blob, IMAGE_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject("Error saving image: " + request.error);
  });
};

export const loadImage = (): Promise<Blob | null> => {
  return new Promise((resolve, reject) => {
    if (!db) return reject("DB not initialized");
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(IMAGE_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject("Error loading image: " + request.error);
  });
};
