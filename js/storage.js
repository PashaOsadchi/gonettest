let db;

function hasSpeedData() {
    return Array.isArray(speedData) && speedData.length > 0;
}

function assertSpeedData(key = 'noData', fallback = 'Немає даних') {
    if (!hasSpeedData()) {
        if (typeof showNotification === 'function' && typeof t === 'function') {
            showNotification(t(key, fallback));
        }
        return false;
    }
    return true;
}

function openDatabase() {
    if (db) return Promise.resolve(db);
    if (!('indexedDB' in window)) {
        return Promise.reject(new Error('IndexedDB is not supported in this environment'));
    }
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('gonettestDB', 1);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(STORAGE_KEY)) {
                database.createObjectStore(STORAGE_KEY);
            }
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
    });
}

async function saveSpeedDataToStorage() {
    const database = await openDatabase();
    const tx = database.transaction(STORAGE_KEY, 'readwrite');
    const store = tx.objectStore(STORAGE_KEY);

    if (!hasSpeedData()) {
        store.clear();
    } else {
        const idx = speedData.length - 1;
        const latest = speedData[idx];
        store.put(latest, idx);
    }

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => {
            try {
                updateDatabaseInfo();
            } catch (err) {
                console.error(err);
                reject(err);
            } finally {
                resolve();
            }
        };
        tx.onerror = () => reject(tx.error);
    });
}

async function loadSpeedDataFromStorage() {
    const database = await openDatabase();

    // First transaction for reading existing data/legacy record
    const readTx = database.transaction(STORAGE_KEY, 'readonly');
    const store = readTx.objectStore(STORAGE_KEY);
    const allReq = store.getAll();
    const keysReq = store.getAllKeys();
    const legacyReq = store.get('records');

    const readResult = await new Promise(resolve => {
        readTx.oncomplete = () => {
            resolve({
                values: allReq.result || [],
                keys: keysReq.result || [],
                legacy: legacyReq.result,
            });
        };
        readTx.onerror = () => resolve({ values: [], keys: [], legacy: null });
    });

    if (Array.isArray(readResult.legacy)) {
        // Migrate legacy array stored under 'records'
        speedData = readResult.legacy;

        const writeTx = database.transaction(STORAGE_KEY, 'readwrite');
        const writeStore = writeTx.objectStore(STORAGE_KEY);
        writeStore.clear();
        speedData.forEach((record, idx) => writeStore.put(record, idx));

        await new Promise((resolve, reject) => {
            writeTx.oncomplete = resolve;
            writeTx.onerror = () => reject(writeTx.error);
        });
    } else {
        if (readResult.legacy !== undefined && readResult.legacy !== null) {
            console.warn('Legacy data is not an array; skipping migration');
        }
        // Build array from individual records
        const pairs = readResult.keys.map((key, idx) => ({
            key: Number(key),
            value: readResult.values[idx],
        }));
        pairs.sort((a, b) => a.key - b.key);
        speedData = pairs.map(p => p.value);
    }

    chartData = speedData
        .slice(-maxDataPoints)
        .map(d => ({ time: d.timestamp, speed: d.speed }));
}
