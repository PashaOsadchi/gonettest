function shouldSaveDataPoint() {
    if (settings.testWithoutGPS) {
        return true;
    }

    if (
        !Number.isFinite(currentGPSData.latitude) ||
        !Number.isFinite(currentGPSData.longitude)
    ) {
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

    if (
        !Number.isFinite(lastSavedGPSData.latitude) ||
        !Number.isFinite(lastSavedGPSData.longitude)
    ) {
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

    const now = new Date();
    const elapsed = (Date.now() - lastSavedTime) / 1000;
    const downloadedDelta =
        (totalBytes - lastSavedBytes) / (1024 * 1024);

    if (settings.testWithoutGPS) {
        const dataPoint = {
            timestamp: now.toLocaleTimeString(),
            fullTimestamp: now,
            speed: currentSpeedMbps,
            downloadedDelta,
            elapsed: Math.floor(elapsed),
            latitude: null,
            longitude: null,
            altitude: null,
            gpsSpeed: null,
            distance: null,
            accuracy: null,
            heading: null,
            region: null,
            rayon: null,
            hromada: null,
            roadRef: null,
        };

        speedData.push(dataPoint);
        lastSavedBytes = totalBytes;
        lastSavedTime = now.getTime();
        saveSpeedDataToStorage();

        lastSavedGPSData = { latitude: null, longitude: null };
        totalDistance = 0;

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

        addLog('Дані збережено без GPS координат');
        return;
    }

    try {
        await loadAllRoadData();
    } catch (e) {
        console.error('Failed to load road data', e);
    }

    const adminInfo =
        (await find_admin_unit(
            currentGPSData.longitude,
            currentGPSData.latitude
        )) || {};
    const roadInfo = find_road(
        currentGPSData.latitude,
        currentGPSData.longitude
    );

    // Обчислюємо відстань для додавання до загальної
    let pointDistance = getDistanceToLastPoint(
        currentGPSData.latitude,
        currentGPSData.longitude
    );
    if (
        Number.isFinite(lastSavedGPSData.latitude) &&
        Number.isFinite(lastSavedGPSData.longitude)
    ) {
        totalDistance += pointDistance;
    }

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
    lastSavedTime = now.getTime();
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
