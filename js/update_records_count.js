window.cachedDataSize = 0;
window.cachedDataLength = 0;
window.cachedQuota = 0;

function initStorageQuota() {
    if (navigator.storage && navigator.storage.estimate) {
        navigator.storage
            .estimate()
            .then(({ quota }) => {
                if (quota) window.cachedQuota = quota;
            })
            .catch(() => {});
    } else if (
        navigator.webkitTemporaryStorage &&
        navigator.webkitTemporaryStorage.queryUsageAndQuota
    ) {
        navigator.webkitTemporaryStorage.queryUsageAndQuota(
            (_usage, quota) => {
                if (quota) window.cachedQuota = quota;
            },
            () => {}
        );
    }
}

function updateRecordsCount() {
    document.getElementById("recordsCount").textContent = speedData.length;
    const label = t('recordsCount', 'Записів:');
    const infoEl = document.getElementById("recordsInfo");
    infoEl.textContent = `${label} ${speedData.length}`;

    if (navigator.storage && navigator.storage.estimate) {
        navigator.storage
            .estimate()
            .then(({ usage, quota }) => {
                const percent = quota ? Math.round((usage / quota) * 100) : 0;
                infoEl.textContent = `${label} ${speedData.length} (${percent}%)`;
                notifyStorageThreshold(percent);
            })
            .catch(err => {
                console.warn("storage estimate failed", err);
                const percent = estimateLocalStoragePercent();
                infoEl.textContent = `${label} ${speedData.length} (${percent}%)`;
                notifyStorageThreshold(percent);
            });
    } else {
        const percent = estimateLocalStoragePercent();
        infoEl.textContent = `${label} ${speedData.length} (${percent}%)`;
        notifyStorageThreshold(percent);
    }
}

function estimateLocalStoragePercent() {
    if (window.cachedDataLength !== speedData.length) {
        window.cachedDataSize = new Blob([JSON.stringify(speedData)]).size;
        window.cachedDataLength = speedData.length;
    }
    const quota = window.cachedQuota || 5 * 1024 * 1024; // 5MB fallback
    return Math.round((window.cachedDataSize / quota) * 100);
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