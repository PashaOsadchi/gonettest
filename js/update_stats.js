const avgSpeedEl = document.getElementById("avgSpeed");
const maxSpeedEl = document.getElementById("maxSpeed");
const minSpeedEl = document.getElementById("minSpeed");

function updateStats() {
    // Include zero speeds so periods of complete outage affect statistics
    if (currentSpeedMbps >= 0) {
        speedStats.min = Math.min(speedStats.min, currentSpeedMbps);
        speedStats.max = Math.max(speedStats.max, currentSpeedMbps);
        speedStats.sum += currentSpeedMbps;
        speedStats.count++;

        const avg = speedStats.sum / speedStats.count;

        if (avgSpeedEl) {
            avgSpeedEl.textContent = `${avg.toFixed(2)}`;
        }
        if (maxSpeedEl) {
            maxSpeedEl.textContent = `${speedStats.max.toFixed(2)}`;
        }
        if (minSpeedEl) {
            minSpeedEl.textContent =
                speedStats.min === Infinity
                    ? "0.00"
                    : `${speedStats.min.toFixed(2)}`;
        }

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

