function updateUI() {
    const now = Date.now();
    const elapsed = (now - startTime) / 1000;
    const delta = totalBytes - prevBytes;
    prevBytes = totalBytes;
    const speedMbps = (delta * 8) / (1024 * 1024);

    currentSpeedMbps = speedMbps;

    if (isConnected) {
        document.getElementById("speedValue").textContent =
            speedMbps.toFixed(2);
        document.getElementById("status").textContent = t('statusActive', 'Тест активний');

        // Ховаємо індикатор помилки
        document.getElementById("alertIndicator").style.display = "none";
    }

    document.getElementById("downloadedValue").textContent = formatDownloaded(totalBytes);
    document.getElementById("timeValue").textContent = formatSeconds(Math.floor(elapsed));

    updateGPSInfo();
    updateChart();
    updateStats();
}