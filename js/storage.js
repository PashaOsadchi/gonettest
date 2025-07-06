function saveSpeedDataToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(speedData));
    updateRecordsCount();
}

function loadSpeedDataFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            speedData = JSON.parse(stored);
            chartData = speedData.slice(-maxDataPoints).map(d => ({ time: d.timestamp, speed: d.speed }));
        } catch (e) {
            speedData = [];
            chartData = [];
        }
    }
}