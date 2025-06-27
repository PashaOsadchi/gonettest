function getColorBySpeed(speed) {
    if (speed <= 0) return 'red';
    if (speed <= 2) return 'yellow';
    return 'green';
}

function initMap() {
    if (mapInitialized) return;
    map = L.map('map').setView([48.3794, 31.1656], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);
    mapInitialized = true;

    // Add previously stored markers without centering on each
    if (speedData.length > 0) {
        speedData.forEach((pt) => addMapMarker(pt, false));
        const last = speedData[speedData.length - 1];
        if (last.latitude != null && last.longitude != null) {
            map.setView([last.latitude, last.longitude], map.getZoom());
        }
    }
}

function initMapIfNeeded() {
    if (!mapInitialized) {
        initMap();
    }
}

function setupMapObserver() {
    const mapEl = document.getElementById('map');
    if (!mapEl || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                initMapIfNeeded();
                obs.disconnect();
            }
        });
    });
    observer.observe(mapEl);
}

function getMarkerPopupContent(point) {
    const na = t('naValue', 'N/A');
    const ts =
        point.fullTimestamp instanceof Date
            ? point.fullTimestamp
            : new Date(point.fullTimestamp);
    const dateStr = ts.toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const timeStr = ts.toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const rows = [
        [t('timestampMsLabel', 'Часова мітка (мс)'), ts.getTime()],
        [t('dateLabel', 'Дата'), dateStr],
        [t('timeLabel', 'Час'), timeStr],
        [t('operatorLabel', 'Оператор'), operator || na],
        [t('speedColumn', 'Швидкість завантаження Мбіт/с'), point.speed.toFixed(2)],
        [t('latColumn', 'Широта'),
            point.latitude != null ? point.latitude.toFixed(6) : na],
        [t('lonColumn', 'Довгота'),
            point.longitude != null ? point.longitude.toFixed(6) : na],
        [t('altColumn', 'Висота (м)'),
            point.altitude != null ? point.altitude.toFixed(1) : na],
        [t('moveSpeedColumn', 'Швидкість руху (км/год)'),
            point.gpsSpeed != null ? point.gpsSpeed.toFixed(1) : na],
        [t('gpsAccuracyLabel', 'Точність (м):'),
            point.accuracy != null ? point.accuracy.toFixed(1) : na],
        [t('headingLabel', 'Напрямок руху:'),
            point.heading != null ? point.heading.toFixed(0) : na],
    ];
    return rows
        .map(r => `<div><strong>${r[0]}</strong> ${r[1]}</div>`)
        .join('');
}

function addMapMarker(point, centerOnAdd = true) {
    if (!map || point.latitude == null || point.longitude == null) return;
    const color = getColorBySpeed(point.speed);
    const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: 6,
        color,
        fillColor: color,
        fillOpacity: 0.8,
    }).addTo(map);
    if (typeof marker.bindPopup === 'function') {
        marker.bindPopup(getMarkerPopupContent(point));
    }
    mapMarkers.push(marker);
    if (centerOnAdd) {
        map.setView([point.latitude, point.longitude], map.getZoom());
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
        return null;
    }

    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Expose helper functions for reuse in other modules or generated HTML
window.getColorBySpeed = getColorBySpeed;
window.getMarkerPopupContent = getMarkerPopupContent;
window.addMapMarker = addMapMarker;
