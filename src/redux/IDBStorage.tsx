const DB_NAME = 'app-store';
const STORE_NAME = 'app-state';

// Open IndexedDB database
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event: any) => {
            resolve(event.target.result);
        };

        request.onerror = (event: any) => {
            reject(`Error opening IndexedDB: ${event.target.error}`);
        };
    });
};

// Save state to IndexedDB
export const setItem = async (key, value) => {

   // console.log("key ", key, value)
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(value, key);
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve('State saved successfully');
        transaction.onerror = (event: any) => reject(`Error saving state: ${event.target.error}`);
    });
};

// Load state from IndexedDB
export const getItem = async (key) => {
   // console.log("get key ", key)

    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event: any) => reject(`Error loading state: ${event.target.error}`);
    });
};

// Remove state from IndexedDB
export const removeItem = async (key) => {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(key);
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve('State removed successfully');
        transaction.onerror = (event: any) => reject(`Error removing state: ${event.target.error}`);
    });
};

// Clear all state from IndexedDB
export const clear = async () => {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve('State cleared successfully');
        transaction.onerror = (event: any) => reject(`Error clearing state: ${event.target.error}`);
    });
};

// Export the storage adapter
export default {
    setItem,
    getItem,
    removeItem,
    clear,
};