function clearData() {
    if (speedData.length === 0) return;

    if (confirm("Ви впевнені, що хочете очистити всі дані?")) {
        speedData = [];
        saveSpeedDataToStorage();
        chartData = [];
        lastSavedGPSData = { latitude: null, longitude: null };
        totalDistance = 0;
        speedStats = { min: Infinity, max: 0, sum: 0, count: 0 };

        if (speedChart) {
            speedChart.data.labels = [];
            speedChart.data.datasets[0].data = [];
            speedChart.update();
        }

        if (typeof map !== 'undefined' && map && mapMarkers.length) {
            mapMarkers.forEach(marker => map.removeLayer(marker));
            mapMarkers = [];
        }
        updateDataDisplay();
        updateRecordsCount();
        updateGPSInfo();

        const lastSaveEl = document.getElementById("lastSaveInfo");
        lastSaveEl.textContent = t('noData', 'Немає даних');
        lastSaveEl.setAttribute('data-i18n', 'noData');
        lastSaveEl.classList.remove('status-accent', 'status-success', 'status-warning');
        document.getElementById("avgSpeed").textContent = "0.00";
        document.getElementById("maxSpeed").textContent = "0.00";
        document.getElementById("minSpeed").textContent = "0.00 ";
        document.getElementById("totalDistanceInfo").textContent = "0.00";

        showNotification(t('dataCleared', 'Дані очищено!'));
    }
}