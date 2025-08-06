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

    try {
        await loadAllRoadData();
    } catch (e) {
        console.error('Failed to load road data', e);
    }

    const adminInfo =
        find_admin_unit(currentGPSData.longitude, currentGPSData.latitude) || {};
    const roadInfo = find_road(
        currentGPSData.longitude,
        currentGPSData.latitude
    );

    const now = new Date();
    const elapsed = (Date.now() - startTime) / 1000;

    // Обчислюємо відстань для додавання до загальної
    let pointDistance = getDistanceToLastPoint(
        currentGPSData.latitude,
        currentGPSData.longitude
    );
    if (lastSavedGPSData.latitude && lastSavedGPSData.longitude) {
        const distance = calculateDistance(
            lastSavedGPSData.latitude,
            lastSavedGPSData.longitude,
            currentGPSData.latitude,
            currentGPSData.longitude
        );
        totalDistance += distance;
    }

    const downloadedDelta =
        (totalBytes - lastSavedBytes) / (1024 * 1024);

    const dataPoint = {
        timestamp: now.toLocaleTimeString(),
        fullTimestamp: now,
        speed: currentSpeedMbps,
        downloadedDelta: downloadedDelta,
        elapsed: Math.floor(elapsed),
        latitude: currentGPSData.latitude,
        longitude: currentGPSData.longitude,
        altitude: currentGPSData.altitude,
        gpsSpeed: currentGPSData.speed ? currentGPSData.speed * 3.6 : null,
        distance: pointDistance,
        accuracy: currentGPSData.accuracy,
        heading: currentGPSData.heading,
        region: adminInfo.region || null,
        rayon: adminInfo.rayon || null,
        hromada: adminInfo.hromada || null,
        roadRef: roadInfo && roadInfo.ref ? roadInfo.ref : null,
    };

    speedData.push(dataPoint);
    lastSavedBytes = totalBytes;
    saveSpeedDataToStorage();
    addMapMarker(dataPoint);

    lastSavedGPSData = {
        latitude: currentGPSData.latitude,
        longitude: currentGPSData.longitude,
    };

    const lastSaveEl = document.getElementById("lastSaveInfo");
    if (lastSaveEl) {
        lastSaveEl.textContent = now.toLocaleTimeString();
        lastSaveEl.removeAttribute('data-i18n');
        lastSaveEl.classList.remove(
            'status-warning',
            'status-success',
            'status-accent'
        );
        lastSaveEl.classList.add('status-accent');
    }

    updateDataDisplay();
    updateDatabaseInfo();
    updateGPSInfo();

    addLog(
        `Дані збережено: ${currentGPSData.latitude.toFixed(
            6
        )}, ${currentGPSData.longitude.toFixed(6)}`
    );
}