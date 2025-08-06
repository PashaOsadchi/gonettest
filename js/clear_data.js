function clearData() {
    if (speedData.length === 0) return;

    if (confirm(t('clearDataConfirm', 'Ви впевнені, що хочете очистити всі дані?'))) {
        speedData = [];
        lastSavedBytes = 0;
        totalBytes = 0;
        saveSpeedDataToStorage();
        chartData = [];
        lastSavedGPSData = { latitude: null, longitude: null };
        totalDistance = 0;
        speedStats = { min: Infinity, max: 0, sum: 0, count: 0 };

        if (speedChart) {
            if (speedChart.data && speedChart.data.datasets && speedChart.data.datasets[0]) {
                speedChart.data.labels = [];
                speedChart.data.datasets[0].data = [];
                speedChart.update();
            }
        }

        if (typeof map !== 'undefined' && map) {
            if (redCluster) redCluster.clearLayers();
            if (yellowCluster) yellowCluster.clearLayers();
            if (greenCluster) greenCluster.clearLayers();
            mapMarkers = [];
        }
        updateDataDisplay();
        updateDatabaseInfo();
        updateGPSInfo();

        const lastSaveEl = document.getElementById("lastSaveInfo");
        if (lastSaveEl) {
            lastSaveEl.textContent = t('noData', 'Немає даних');
            lastSaveEl.setAttribute('data-i18n', 'noData');
            lastSaveEl.classList.remove('status-accent', 'status-success', 'status-warning');
        }

        const avgSpeed = document.getElementById("avgSpeed");
        if (avgSpeed) avgSpeed.textContent = "0.00";

        const maxSpeed = document.getElementById("maxSpeed");
        if (maxSpeed) maxSpeed.textContent = "0.00";

        const minSpeed = document.getElementById("minSpeed");
        if (minSpeed) minSpeed.textContent = "0.00 ";

        const totalDistanceInfo = document.getElementById("totalDistanceInfo");
        if (totalDistanceInfo) totalDistanceInfo.textContent = "0.00";

        showNotification(t('dataCleared', 'Дані очищено!'));
    }
}
