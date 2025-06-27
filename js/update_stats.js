function updateStats() {
    if (currentSpeedMbps > 0) {
        speedStats.min = Math.min(speedStats.min, currentSpeedMbps);
        speedStats.max = Math.max(speedStats.max, currentSpeedMbps);
        speedStats.sum += currentSpeedMbps;
        speedStats.count++;

        const avg = speedStats.sum / speedStats.count;

        document.getElementById("avgSpeed").textContent = `${avg.toFixed(
            2
        )}`;
        document.getElementById(
            "maxSpeed"
        ).textContent = `${speedStats.max.toFixed(2)}`;
        document.getElementById("minSpeed").textContent =
            speedStats.min === Infinity
                ? "0.00"
                : `${speedStats.min.toFixed(2)}`;

        // Перевірка порогу швидкості
        if (currentSpeedMbps < settings.speedThreshold && isConnected) {
            playBeep(400, 300);
            if (settings.voiceAlerts) {
                speak(
                    `Швидкість знизилась до ${currentSpeedMbps.toFixed(
                        1
                    )} мегабіт на секунду`
                );
            }
        }
    }
}