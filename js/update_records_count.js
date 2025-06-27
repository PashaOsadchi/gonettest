function updateRecordsCount() {
    document.getElementById("recordsCount").textContent = speedData.length;
    const label = (window.i18n && window.i18n[currentLang] && window.i18n[currentLang].recordsCount) || 'Записів:';
    const infoEl = document.getElementById("recordsInfo");
    infoEl.textContent = `${label} ${speedData.length}`;

    if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(({ usage, quota }) => {
            const percent = quota ? Math.round((usage / quota) * 100) : 0;
            infoEl.textContent = `${label} ${speedData.length} (${percent}%)`;
            const thresholds = [50, 90, 95, 99];
            window.lastStoragePercent = window.lastStoragePercent || 0;
            thresholds.forEach(th => {
                if (percent >= th && window.lastStoragePercent < th) {
                    showNotification(
                        t(
                            `storage${th}`,
                            `Локальне сховище заповнене на ${th}%`
                        )
                    );
                }
            });
            window.lastStoragePercent = percent;
        });
    }
}