import { getColorBySpeed, ensureColon, addMapMarker } from './map_utils.js';
import { HROMADY_GEOJSON, ROAD_FILES, SPEED_CAMERA_FILE } from './config.js';

function initMap() {
    if (mapInitialized) return;
    map = L.map('map').setView(MAP_DEFAULT_CENTER, 6);
    L.tileLayer(OSM_TILE_URL, {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Initialize clustering groups for different speed ranges
    const makeClusterIconClass = className => cluster =>
        L.divIcon({
            html: `<div class="speed-cluster ${className}">${cluster.getChildCount()}</div>`,
            className: 'speed-cluster-wrapper',
            iconSize: [34, 34]
        });

    redCluster = L.markerClusterGroup({
        disableClusteringAtZoom: DISABLE_CLUSTER_ZOOM,
        iconCreateFunction: makeClusterIconClass('red')
    });
    yellowCluster = L.markerClusterGroup({
        disableClusteringAtZoom: DISABLE_CLUSTER_ZOOM,
        iconCreateFunction: makeClusterIconClass('yellow')
    });
    greenCluster = L.markerClusterGroup({
        disableClusteringAtZoom: DISABLE_CLUSTER_ZOOM,
        iconCreateFunction: makeClusterIconClass('green')
    });

    redCluster.addTo(map);
    yellowCluster.addTo(map);
    greenCluster.addTo(map);

    L.control.layers(null, {
        [t('layerRed', 'Швидкість завантаження = 0 Мбіт/с (червоні)')]: redCluster,
        [t('layerYellow', 'Швидкість завантаження до 2 Мбіт/с (жовті)')]: yellowCluster,
        [t('layerGreen', 'Швидкість завантаження більше 2 Мбіт/с (зелені)')]: greenCluster
    }, { collapsed: true }).addTo(map);
    mapInitialized = true;
    updateHromadyLayer();
    updateRoadLayers();

    // Add previously stored markers without centering on each
    if (typeof speedData !== 'undefined' && Array.isArray(speedData) && speedData.length > 0) {
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

    const speedValue = Number.isFinite(point.speed)
        ? point.speed.toFixed(2)
        : na;

    const rows = [
        [ensureColon(t('timestampMsLabel', 'Часова мітка (мс)')), ts.getTime()],
        [ensureColon(t('dateLabel', 'Дата')), dateStr],
        [ensureColon(t('timeLabel', 'Час')), timeStr],
        [ensureColon(t('operatorLabel', 'Оператор')), operator || na],
        [ensureColon(t('speedColumn', 'Швидкість завантаження Мбіт/с')), speedValue],
        [ensureColon(t('latColumn', 'Широта')),
            point.latitude != null ? point.latitude.toFixed(6) : na],
        [ensureColon(t('lonColumn', 'Довгота')),
            point.longitude != null ? point.longitude.toFixed(6) : na],
        [ensureColon(t('oblastLabel', 'Область')),
            point.region != null ? point.region : na],
        [ensureColon(t('raionLabel', 'Район')),
            point.rayon != null ? point.rayon : na],
        [ensureColon(t('hromadaLabel', 'Громада')),
            point.hromada != null ? point.hromada : na],
        [ensureColon(t('roadRefLabel', 'Номер дороги')),
            point.roadRef != null ? point.roadRef : na],
        [ensureColon(t('altColumn', 'Висота (м)')),
            point.altitude != null ? point.altitude.toFixed(1) : na],
        [ensureColon(t('moveSpeedColumn', 'Швидкість руху (км/год)')),
            point.gpsSpeed != null ? point.gpsSpeed.toFixed(1) : na],
        [ensureColon(t('distanceColumn', 'Відстань (м)')),
            point.distance != null ? point.distance.toFixed(1) : na],
        [ensureColon(t('gpsAccuracyLabel', 'Точність (м)')),
            point.accuracy != null ? point.accuracy.toFixed(1) : na],
        [ensureColon(t('headingLabel', 'Напрямок руху')),
            point.heading != null ? point.heading.toFixed(0) : na],
    ];
    return rows
        .map(r => `<div><strong>${r[0]}</strong> ${r[1]}</div>`)
        .join('');
}

function getRoadPopupContent(props) {
    const na = t('naValue', 'N/A');

    const rows = [
        [ensureColon(t('roadRefLabel', 'Номер дороги')), props.ref || na],
        [ensureColon(t('roadNameLabel', 'Назва')), props.official_name || props['name:uk'] || props.name || na],
    ];
    if (props.distance != null) {
        rows.push([ensureColon(t('roadDistanceLabel', 'Довжина (км)')), props.distance]);
    }
    if (props.network != null) {
        rows.push([ensureColon(t('roadNetworkLabel', 'Тип')), props.network]);
    }
    return rows.map(r => `<div><strong>${r[0]}</strong> ${r[1]}</div>`).join('');
}

function onEachRoadFeature(feature, layer) {
    if (feature.properties && typeof layer.bindPopup === 'function') {
        layer.bindPopup(getRoadPopupContent(feature.properties));
    }
}

function updateHromadyLayer() {
    if (!mapInitialized) return;
    if (settings.showHromady) {
        if (hromadyLayer) {
            hromadyLayer.addTo(map);
        } else {
            fetch(HROMADY_GEOJSON)
                .then(r => r.json())
                .then(data => {
                    hromadyLayer = L.geoJSON(data, { style: { color: '#555', weight: 1 } }).addTo(map);
                })
                .catch(err => console.error('GeoJSON load failed', err));
        }
    } else if (hromadyLayer) {
        map.removeLayer(hromadyLayer);
    }
}

function updateRoadLayers() {
    if (!mapInitialized) return;
    updateInternationalRoadLayer();
    updateNationalRoadLayer();
    updateRegionalRoadLayer();
    updateTerritorialRoadLayer();
    updateSpeedCameraLayer();
}

function updateInternationalRoadLayer() {
    if (settings.showInternationalRoads) {
        if (internationalRoadLayer) {
            internationalRoadLayer.addTo(map);
        } else {
            fetch(ROAD_FILES.international)
                .then(r => r.json())
                .then(data => {
                    internationalRoadLayer = L.geoJSON(data, {
                        style: { color: 'blue', weight: 2 },
                        onEachFeature: onEachRoadFeature,
                    }).addTo(map);
                })
                .catch(err => console.error('GeoJSON load failed', err));
        }
    } else if (internationalRoadLayer) {
        map.removeLayer(internationalRoadLayer);
    }
}

function updateNationalRoadLayer() {
    if (settings.showNationalRoads) {
        if (nationalRoadLayer) {
            nationalRoadLayer.addTo(map);
        } else {
            fetch(ROAD_FILES.national)
                .then(r => r.json())
                .then(data => {
                    nationalRoadLayer = L.geoJSON(data, {
                        style: { color: 'green', weight: 2 },
                        onEachFeature: onEachRoadFeature,
                    }).addTo(map);
                })
                .catch(err => console.error('GeoJSON load failed', err));
        }
    } else if (nationalRoadLayer) {
        map.removeLayer(nationalRoadLayer);
    }
}

function updateRegionalRoadLayer() {
    if (settings.showRegionalRoads) {
        if (regionalRoadLayer) {
            regionalRoadLayer.addTo(map);
        } else {
            fetch(ROAD_FILES.regional)
                .then(r => r.json())
                .then(data => {
                    regionalRoadLayer = L.geoJSON(data, {
                        style: { color: 'orange', weight: 2 },
                        onEachFeature: onEachRoadFeature,
                    }).addTo(map);
                })
                .catch(err => console.error('GeoJSON load failed', err));
        }
    } else if (regionalRoadLayer) {
        map.removeLayer(regionalRoadLayer);
    }
}

function updateTerritorialRoadLayer() {
    if (settings.showTerritorialRoads) {
        if (territorialRoadLayer) {
            territorialRoadLayer.addTo(map);
        } else {
            fetch(ROAD_FILES.territorial)
                .then(r => r.json())
                .then(data => {
                    territorialRoadLayer = L.geoJSON(data, {
                        style: { color: 'red', weight: 2 },
                        onEachFeature: onEachRoadFeature,
                    }).addTo(map);
                })
                .catch(err => console.error('GeoJSON load failed', err));
        }
    } else if (territorialRoadLayer) {
        map.removeLayer(territorialRoadLayer);
    }
}

function updateSpeedCameraLayer() {
    if (settings.showSpeedCameras) {
        if (speedCameraLayer) {
            speedCameraLayer.addTo(map);
        } else {
            fetch(SPEED_CAMERA_FILE)
                .then(r => r.json())
                .then(data => {
                    const layers = data
                        .map(item => {
                            const lat = item["Широта"];
                            const lon = item["Довгота"];
                            if (lat == null || lon == null) return null;
                            const innerCircle = L.circle([lat, lon], {
                                color: 'red',
                                fillColor: 'red',
                                fillOpacity: 0.5,
                                radius: 100,
                            });
                            const outerCircle = L.circle([lat, lon], {
                                color: 'yellow',
                                fillColor: 'yellow',
                                fillOpacity: 0.3,
                                radius: 500,
                            });

                            const popupContent = Object.entries(item)
                                .map(([key, value]) =>
                                    `<div><strong>${ensureColon(key)}</strong> ${value ?? ''}</div>`
                                )
                                .join('');

                            const group = L.layerGroup([innerCircle, outerCircle]).bindPopup(popupContent);
                            return group;
                        })
                        .filter(Boolean);
                    speedCameraLayer = L.layerGroup(layers).addTo(map);
                })
                .catch(err => console.error('Speed camera load failed', err));
        }
    } else if (speedCameraLayer) {
        map.removeLayer(speedCameraLayer);
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
window.updateHromadyLayer = updateHromadyLayer;
window.updateRoadLayers = updateRoadLayers;
window.setupMapObserver = setupMapObserver;
window.initMapIfNeeded = initMapIfNeeded;
window.calculateDistance = calculateDistance;
