function initGPS() {
    if (!navigator.geolocation) {
        addLog("GPS не підтримується браузером");
        document.getElementById("gpsStatus").textContent = t('gpsNotSupported', 'Не підтримується');
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: GPS_TIMEOUT,
        maximumAge: GPS_MAX_AGE,
    };

    gpsWatchId = navigator.geolocation.watchPosition(
        (position) => {
            currentGPSData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                altitude: position.coords.altitude,
                speed: position.coords.speed,
                accuracy: position.coords.accuracy,
                heading: position.coords.heading,
            };
            updateAdminInfo();
            updateRoadInfo();
            updateGPSInfo();
            addLog(
                `GPS оновлено: ${currentGPSData.latitude.toFixed(
                    6
                )}, ${currentGPSData.longitude.toFixed(6)}`
            );
        },
        (error) => {
            addLog(`GPS помилка: ${error.message}`);
            const statusEl = document.getElementById("gpsStatus");
            statusEl.textContent = t('gpsError', 'Помилка GPS');
            statusEl.classList.remove('status-accent', 'status-success', 'status-warning');
            statusEl.classList.add('status-warning');
        },
        options
    );
}

function stopGPS() {
    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
        const statusEl = document.getElementById("gpsStatus");
        statusEl.textContent = t('gpsInactive', 'Не активний');
        statusEl.classList.remove('status-accent', 'status-success', 'status-warning');
        addLog("GPS зупинено");
    }
}