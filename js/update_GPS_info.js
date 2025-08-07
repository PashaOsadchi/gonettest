function updateGPSInfo() {
    const gpsStatusEl = document.getElementById("gpsStatus");
    const currentCoordsEl = document.getElementById("currentCoords");
    const distanceInfoEl = document.getElementById("distanceInfo");
    const gpsAccuracyEl = document.getElementById("gpsAccuracy");
    const altitudeInfoEl = document.getElementById("altitudeInfo");
    const gpsSpeedInfoEl = document.getElementById("gpsSpeedInfo");
    const headingInfoEl = document.getElementById("headingInfo");
    const totalDistanceInfoEl =
        document.getElementById("totalDistanceInfo");

    const naText = t('naValue', 'N/A');
    const directions = t('directionLabels', DEFAULT_DIRECTION_LABELS[currentLang]);

    if (
        Number.isFinite(currentGPSData.latitude) &&
        Number.isFinite(currentGPSData.longitude)
    ) {
        gpsStatusEl.textContent = t('gpsActive', 'Активний');
        gpsStatusEl.classList.remove('status-warning', 'status-success', 'status-accent');
        gpsStatusEl.classList.add('status-accent');
        currentCoordsEl.textContent = `${currentGPSData.latitude.toFixed(
            6
        )}, ${currentGPSData.longitude.toFixed(6)}`;

        // Точність
        if (currentGPSData.accuracy != null) {
            gpsAccuracyEl.textContent = `±${currentGPSData.accuracy.toFixed(
                1
            )}`;
            gpsAccuracyEl.classList.remove('status-warning', 'status-success', 'status-accent');
            if (currentGPSData.accuracy < 10) {
                gpsAccuracyEl.classList.add('status-accent');
            } else if (currentGPSData.accuracy < 50) {
                gpsAccuracyEl.classList.add('status-success');
            } else {
                gpsAccuracyEl.classList.add('status-warning');
            }
        } else {
            gpsAccuracyEl.classList.remove('status-warning', 'status-success', 'status-accent');
            gpsAccuracyEl.textContent = naText;
        }

        // Висота
        if (Number.isFinite(currentGPSData.altitude)) {
            altitudeInfoEl.textContent = `${currentGPSData.altitude.toFixed(
                1
            )}`;
        } else {
            altitudeInfoEl.textContent = naText;
        }

        // GPS швидкість
        if (Number.isFinite(currentGPSData.speed) && currentGPSData.speed > 0) {
            gpsSpeedInfoEl.textContent = `${(
                currentGPSData.speed * 3.6
            ).toFixed(1)}`;
        } else {
            gpsSpeedInfoEl.textContent = naText;
        }

        // Напрямок
        if (Number.isFinite(currentGPSData.heading)) {
            const directionIndex =
                Math.round(currentGPSData.heading / 45) % directions.length;
            headingInfoEl.textContent = `${currentGPSData.heading.toFixed(
                0
            )}° (${directions[directionIndex]})`;
        } else {
            headingInfoEl.textContent = naText;
        }

        // Відстань від попередньої точки
        if (
            Number.isFinite(lastSavedGPSData.latitude) &&
            Number.isFinite(lastSavedGPSData.longitude)
        ) {
            const distance = calculateDistance(
                lastSavedGPSData.latitude,
                lastSavedGPSData.longitude,
                currentGPSData.latitude,
                currentGPSData.longitude
            );
            distanceInfoEl.textContent = `${distance.toFixed(1)}`;

            distanceInfoEl.classList.remove('status-warning', 'status-success', 'status-accent');
            if (distance > settings.gpsDistance) {
                distanceInfoEl.classList.add('status-accent');
            } else {
                distanceInfoEl.classList.add('status-warning');
            }
        } else {
            distanceInfoEl.textContent = t('firstPoint', 'Перша точка');
            distanceInfoEl.classList.remove('status-warning', 'status-accent');
            distanceInfoEl.classList.add('status-success');
        }

        // Загальна відстань
        totalDistanceInfoEl.textContent = `${(totalDistance / 1000).toFixed(
            2
        )}`;
    } else {
        gpsStatusEl.textContent = t('gpsWaiting', 'Очікування сигналу');
        gpsStatusEl.classList.remove('status-accent', 'status-success', 'status-warning');
        gpsStatusEl.classList.add('status-warning');
        currentCoordsEl.textContent = naText;
        distanceInfoEl.textContent = naText;
        gpsAccuracyEl.textContent = naText;
        altitudeInfoEl.textContent = naText;
        gpsSpeedInfoEl.textContent = naText;
        headingInfoEl.textContent = naText;
    }

    updateAdminInfo();
    updateRoadInfo();
}

async function updateAdminInfo() {
    const oblastEl = document.getElementById('oblast');
    const raionEl = document.getElementById('raion');
    const hromadaEl = document.getElementById('hromada');

    if (
        !Number.isFinite(currentGPSData.latitude) ||
        !Number.isFinite(currentGPSData.longitude)
    ) {
        oblastEl.textContent = '-';
        raionEl.textContent = '-';
        hromadaEl.textContent = '-';
        return;
    }

    let info = null;
    try {
        info = await find_admin_unit(
            currentGPSData.longitude,
            currentGPSData.latitude
        );
    } catch (e) {
        console.error('Failed to load hromady data', e);
    }

    announceAdminChange(info);

    if (info) {
        oblastEl.textContent = info.region || '-';
        raionEl.textContent = info.rayon || '-';
        hromadaEl.textContent = info.hromada || '-';
    } else {
        oblastEl.textContent = '-';
        raionEl.textContent = '-';
        hromadaEl.textContent = '-';
    }
}

async function updateRoadInfo() {
    const refEl = document.getElementById('roadRef');
    const nameEl = document.getElementById('roadName');
    const distEl = document.getElementById('roadDistance');
    const networkEl = document.getElementById('roadNetwork');

    if (
        !Number.isFinite(currentGPSData.latitude) ||
        !Number.isFinite(currentGPSData.longitude)
    ) {
        refEl.textContent = '-';
        nameEl.textContent = '-';
        distEl.textContent = '-';
        networkEl.textContent = '-';
        return;
    }

    try {
        await loadAllRoadData();
    } catch (e) {
        console.error('Failed to load road data', e);
        refEl.textContent = '-';
        nameEl.textContent = '-';
        distEl.textContent = '-';
        networkEl.textContent = '-';
        return;
    }

    const road = find_road(currentGPSData.latitude, currentGPSData.longitude);
    announceRoadChange(road);

    if (road) {
        refEl.textContent = road.ref || '-';
        nameEl.textContent = road.official_name || road['name:uk'] || road.name || '-';
        distEl.textContent = road.distance || '-';
        networkEl.textContent = road.network || '-';
    } else {
        refEl.textContent = '-';
        nameEl.textContent = '-';
        distEl.textContent = '-';
        networkEl.textContent = '-';
    }
}