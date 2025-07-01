// Ініціалізація після побудови DOM
window.addEventListener("DOMContentLoaded", () => {
    initLanguage();
    loadTheme();
    loadSettingsFromStorage();
    loadSpeedDataFromStorage();
    initChart();
    loadSettings();
    updateGPSInfo();
    requestWakeLock();
    setupMapObserver();
    updateDataDisplay();
    updateRecordsCount();

    // Обробка виходу з повноекранного режиму
    document.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement && isFullscreen) {
            toggleFullscreen();
        }
    });
});

// Обробка зміни орієнтації для мобільних
window.addEventListener("orientationchange", () => {
    setTimeout(() => {
        if (speedChart) {
            speedChart.resize();
        }
    }, ORIENTATION_DELAY);
});