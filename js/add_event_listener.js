// Ініціалізація після побудови DOM
window.addEventListener("DOMContentLoaded", async () => {
    initStorageQuota();
    initLanguage();
    try {
        await loadHromadyData();
    } catch (err) {
        console.error('Failed to load hromady data', err);
    }
    loadTheme();
    loadSettingsFromStorage();
    try {
        await loadSpeedDataFromStorage();
    } catch (err) {
        console.error('Failed to load speed data from storage', err);
    }
    window.initChart();
    loadSettings();
    updateGPSInfo();
    requestWakeLock();
    setupMapObserver();
    updateDataDisplay();
    updateDatabaseInfo();

    if (window.lucide) {
        lucide.createIcons({ strokeWidth: 1.5, class: 'h-6 w-6' });
    }

});

// Обробка зміни орієнтації для мобільних
window.addEventListener("orientationchange", () => {
    setTimeout(() => {
        if (speedChart) {
            speedChart.resize();
        }
    }, ORIENTATION_DELAY);
});
