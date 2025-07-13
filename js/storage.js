let db;

function openDatabase() {
    if (db) return Promise.resolve(db);
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
    tx.objectStore(STORAGE_KEY).put(speedData, 'records');
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => {
            updateRecordsCount();
            resolve();
        };
        tx.onerror = () => reject(tx.error);
    });
}

async function loadSpeedDataFromStorage() {
    const database = await openDatabase();
    const tx = database.transaction(STORAGE_KEY, 'readonly');
    const request = tx.objectStore(STORAGE_KEY).get('records');
    return new Promise((resolve) => {
        request.onsuccess = () => {
            try {
                speedData = request.result || [];
                chartData = speedData
                    .slice(-maxDataPoints)
                    .map((d) => ({ time: d.timestamp, speed: d.speed }));
            } catch (e) {
                speedData = [];
                chartData = [];
            }
            resolve();
        };
        request.onerror = () => {
            speedData = [];
            chartData = [];
            resolve();
        };
    });
}