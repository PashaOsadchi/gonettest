function updateRecordsCount() {
    document.getElementById("recordsCount").textContent = speedData.length;
    const label = (window.i18n && window.i18n[currentLang] && window.i18n[currentLang].recordsCount) || 'Записів:';
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
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        total += new Blob([key]).size + new Blob([val]).size;
    }
    const quota = 5 * 1024 * 1024; // 5MB fallback
    return Math.round((total / quota) * 100);
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