

interface CacheItem<T> {
    key: string;
    value: T;
    expiry: number;
}

const Static = {
    dbName: 'firebase-cacheDB',
    storeName: 'firebase-cacheStore',
}

const timeCalc = (m: number): number => m * 60 * 1000;

const openDatabase = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(Static.dbName, 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(Static.storeName)) {
                db.createObjectStore(Static.storeName, { keyPath: 'key' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
};


const setWithExpiry = async <T>(key: string, value: T, ttl: number = 9): Promise<void> => {
    const db = await openDatabase();
    const transaction = db.transaction(Static.storeName, 'readwrite');
    const store = transaction.objectStore(Static.storeName);

    const now = Date.now();

    const item: CacheItem<T> = {
        key,
        value,
        expiry: now + timeCalc(ttl),
    };

    return new Promise((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
};

const getWithExpiry = async <T>(key: string): Promise<T | null> => {
    const db = await openDatabase();
    const transaction = db.transaction(Static.storeName, 'readonly');
    const store = transaction.objectStore(Static.storeName);

    return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = async () => {
            const item = request.result as CacheItem<T> | undefined;

            if (!item) {
                resolve(null); // Item not found
                return;
            }

            const now = Date.now();

            if (now > item.expiry) {
                // Remove expired item automatically
                const deleteTransaction = db.transaction(Static.storeName, 'readwrite');
                const deleteStore = deleteTransaction.objectStore(Static.storeName);
                deleteStore.delete(key);

                resolve(null); // Return null for expired data
            } else {
                resolve(item.value); // Return valid data
            }
        };

        request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
};


const cleanupExpiredItems = async (): Promise<void> => {
    const db = await openDatabase();
    const transaction = db.transaction(Static.storeName, 'readwrite');
    const store = transaction.objectStore(Static.storeName);

    return new Promise((resolve, reject) => {
        const request = store.openCursor();
        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

            if (cursor) {
                const item = cursor.value as CacheItem<unknown>;
                const now = Date.now();

                if (now > item.expiry) {
                    // Delete expired item
                    store.delete(cursor.key as IDBValidKey);
                }
                cursor.continue(); // Continue to the next item
            } else {
                resolve(); // Cleanup completed
            }
        };

        request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
};

export { cleanupExpiredItems, getWithExpiry, setWithExpiry };
