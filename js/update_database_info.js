window.cachedDataSize = 0;
window.cachedDataLength = 0;
window.cachedDataJSON = '';
window.cachedQuota = 0;

function initStorageQuota() {
    if (navigator.storage && navigator.storage.estimate) {
        navigator.storage
            .estimate()
            .then(({ quota }) => {
                if (quota) window.cachedQuota = quota;
            })
            .catch(err => console.error('Storage estimate failed', err));
    } else if (
        navigator.webkitTemporaryStorage &&
        navigator.webkitTemporaryStorage.queryUsageAndQuota
    ) {
        navigator.webkitTemporaryStorage.queryUsageAndQuota(
            (_usage, quota) => {
                if (quota) window.cachedQuota = quota;
            },
            (err) => console.error('Quota query failed', err)
        );
    }
}

function updateDatabaseInfo() {
    const recordsCountEl = document.getElementById("recordsCount");
    if (recordsCountEl) {
        recordsCountEl.textContent = speedData.length;
    } else {
        console.warn("recordsCount element not found");
    }
    const recordsEl = document.getElementById("dbRecordsCount");
    const sizeEl = document.getElementById("dbSize");

    const setInfo = sizeBytes => {
        const sizeStr = formatDownloaded(sizeBytes);
        if (recordsEl) recordsEl.textContent = speedData.length;
        if (sizeEl) sizeEl.textContent = sizeStr;
    };

    if (navigator.storage && navigator.storage.estimate) {
        navigator.storage
            .estimate()
            .then(({ usage, quota }) => {
                setInfo(usage);
                if (quota) {
                    const percent = Math.round((usage / quota) * 100);
                    notifyStorageThreshold(percent);
                }
            })
            .catch(err => {
                console.warn("storage estimate failed", err);
                const size = estimateLocalStorageSize();
                setInfo(size);
                const quota = window.cachedQuota || 5 * 1024 * 1024; // 5MB fallback
                const percent = quota ? Math.round((size / quota) * 100) : 0;
                notifyStorageThreshold(percent);
            });
    } else {
        const size = estimateLocalStorageSize();
        setInfo(size);
        const quota = window.cachedQuota || 5 * 1024 * 1024; // 5MB fallback
        const percent = quota ? Math.round((size / quota) * 100) : 0;
        notifyStorageThreshold(percent);
    }

    if (typeof updateSpeedDistribution === 'function') {
        updateSpeedDistribution();
    }

    if (typeof updateRoadStats === 'function') {
        updateRoadStats();
    }
    if (typeof updateAdminStats === "function") {
        updateAdminStats();
    }
}

function estimateLocalStorageSize() {
    const dataJSON = JSON.stringify(speedData);
    if (
        window.cachedDataLength !== speedData.length ||
        window.cachedDataJSON !== dataJSON
    ) {
        window.cachedDataSize = new Blob([dataJSON]).size;
        window.cachedDataLength = speedData.length;
        window.cachedDataJSON = dataJSON;
    }
    return window.cachedDataSize;
}

function notifyStorageThreshold(percent) {
    const thresholds = [50, 90, 95, 99];
    window.lastStoragePercent = window.lastStoragePercent || 0;
    thresholds.forEach(th => {
        if (percent >= th && window.lastStoragePercent < th) {
            showNotification(
                t(`storage${th}`, `Локальне сховище заповнене на ${th}%`)
            );
        }
    });
    window.lastStoragePercent = percent;
}
