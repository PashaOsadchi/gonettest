function shouldSaveDataPoint() {
    if (!currentGPSData.latitude || !currentGPSData.longitude) {
        return false;
    }

    if (
        currentGPSData.accuracy !== null &&
        currentGPSData.accuracy > MAX_GPS_ACCURACY
    ) {
        addLog(
            `GPS accuracy ${currentGPSData.accuracy} > ${MAX_GPS_ACCURACY}, skipping`
        );
        return false;
    }

    if (!lastSavedGPSData.latitude || !lastSavedGPSData.longitude) {
        return true;
    }

    const distance = calculateDistance(
        lastSavedGPSData.latitude,
        lastSavedGPSData.longitude,
        currentGPSData.latitude,
        currentGPSData.longitude
    );

    return distance > settings.gpsDistance;
}

async function saveDataPoint() {
    if (!testActive) return;

    if (!shouldSaveDataPoint()) {
        return;
    }

    try {
        await loadHromadyData();
    } catch (e) {
        console.error('Failed to load hromady data', e);
    }

    const adminInfo = find_admin_unit(
        currentGPSData.longitude,
        currentGPSData.latitude
    ) || {};

    const now = new Date();
    const elapsed = (Date.now() - startTime) / 1000;

    // Обчислюємо відстань для додавання до загальної
    if (lastSavedGPSData.latitude && lastSavedGPSData.longitude) {
        const distance = calculateDistance(
            lastSavedGPSData.latitude,
            lastSavedGPSData.longitude,
            currentGPSData.latitude,
            currentGPSData.longitude
        );
        totalDistance += distance;
    }

    const dataPoint = {
        timestamp: now.toLocaleTimeString(),
        fullTimestamp: now,
        speed: currentSpeedMbps,
        downloaded: totalBytes / (1024 * 1024),
        elapsed: Math.floor(elapsed),
        latitude: currentGPSData.latitude,
        longitude: currentGPSData.longitude,
        altitude: currentGPSData.altitude,
        gpsSpeed: currentGPSData.speed ? currentGPSData.speed * 3.6 : null,
        accuracy: currentGPSData.accuracy,
        heading: currentGPSData.heading,
        region: adminInfo.region || null,
        rayon: adminInfo.rayon || null,
        hromada: adminInfo.hromada || null,
    };

    speedData.push(dataPoint);
    saveSpeedDataToStorage();
    addMapMarker(dataPoint);

    lastSavedGPSData = {
        latitude: currentGPSData.latitude,
        longitude: currentGPSData.longitude,
    };

    const lastSaveEl = document.getElementById("lastSaveInfo");
    lastSaveEl.textContent = now.toLocaleTimeString();
    lastSaveEl.removeAttribute('data-i18n');
    lastSaveEl.classList.remove('status-warning', 'status-success', 'status-accent');
    lastSaveEl.classList.add('status-accent');

    updateDataDisplay();
    updateRecordsCount();
    updateGPSInfo();

    addLog(
        `Дані збережено: ${currentGPSData.latitude.toFixed(
            6
        )}, ${currentGPSData.longitude.toFixed(6)}`
    );
}