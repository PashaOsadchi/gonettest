function updateUI() {
    const now = Date.now();
    const elapsed = (now - startTime) / 1000;

    const speedValueEl = document.getElementById("speedValue");
    if (!speedValueEl) {
        console.error("Element 'speedValue' not found");
        return;
    }

    const statusEl = document.getElementById("status");
    if (!statusEl) {
        console.error("Element 'status' not found");
        return;
    }

    const alertIndicatorEl = document.getElementById("alertIndicator");
    if (!alertIndicatorEl) {
        console.error("Element 'alertIndicator' not found");
        return;
    }

    const downloadedValueEl = document.getElementById("downloadedValue");
    if (!downloadedValueEl) {
        console.error("Element 'downloadedValue' not found");
        return;
    }

    const timeValueEl = document.getElementById("timeValue");
    if (!timeValueEl) {
        console.error("Element 'timeValue' not found");
        return;
    }

    if (isConnected) {
        speedValueEl.textContent = currentSpeedMbps.toFixed(2);
        statusEl.textContent = t('statusActive', 'Тест активний');

        // Ховаємо індикатор помилки
        alertIndicatorEl.style.display = "none";
    }

    downloadedValueEl.textContent = formatDownloaded(totalBytes);
    timeValueEl.textContent = formatSeconds(Math.floor(elapsed));

    updateGPSInfo();
}
