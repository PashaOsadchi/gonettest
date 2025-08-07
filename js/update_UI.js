function updateUI() {
    const now = Date.now();
    const elapsed = (now - startTime) / 1000;

    if (isConnected) {
        document.getElementById("speedValue").textContent =
            currentSpeedMbps.toFixed(2);
        document.getElementById("status").textContent = t('statusActive', 'Тест активний');

        // Ховаємо індикатор помилки
        document.getElementById("alertIndicator").style.display = "none";
    }

    document.getElementById("downloadedValue").textContent = formatDownloaded(totalBytes);
    document.getElementById("timeValue").textContent = formatSeconds(Math.floor(elapsed));

    updateGPSInfo();
}
