import { getColorBySpeed, ensureColon, addMapMarker } from './map_utils.js';

function downloadHTML() {
    if (typeof speedData === 'undefined' || !Array.isArray(speedData)) {
        console.error('speedData is undefined');
        return;
    }
    if (typeof operator === 'undefined') {
        console.error('operator is undefined');
        return;
    }
    if (typeof t !== 'function' || typeof showNotification !== 'function') {
        console.error('Required helpers are missing');
        return;
    }

    if (!ensureSpeedData()) return;

    const baseFileName = buildBaseFileName(speedData, operator);

    const safeData = JSON.stringify(speedData).replace(/<\/script>/g, '<\\/script>');

    if (typeof window.getMarkerPopupContent !== 'function') {
        console.error('window.getMarkerPopupContent is not a function');
        return;
    }
    const getColorBySpeedSrc = getColorBySpeed.toString();
    const ensureColonSrc = ensureColon.toString();
    const addMapMarkerSrc = addMapMarker.toString();
    let getMarkerPopupContentSrc = window.getMarkerPopupContent.toString();

    if (!getMarkerPopupContentSrc.includes("distanceColumn")) {
        const speedRow =
            "point.gpsSpeed != null ? point.gpsSpeed.toFixed(1) : na],";
        const distanceRow =
            "        [ensureColon(t('distanceColumn', 'Відстань (м)')), " +
            "point.distance != null ? point.distance.toFixed(1) : na],";
        const idx = getMarkerPopupContentSrc.indexOf(speedRow);
        if (idx !== -1) {
            const insertPos = idx + speedRow.length;
            getMarkerPopupContentSrc =
                getMarkerPopupContentSrc.slice(0, insertPos) +
                '\n' +
                distanceRow +
                getMarkerPopupContentSrc.slice(insertPos);
        }
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="utf-8">
<title>${baseFileName}</title>

<!-- Leaflet CSS -->
<link
  rel="stylesheet"
  href="${LEAFLET_CSS_URL}"
/>

<!-- MarkerCluster CSS -->
<link
  rel="stylesheet"
  href="${MARKERCLUSTER_CSS_URL}"
/>
<link
  rel="stylesheet"
  href="${MARKERCLUSTER_DEFAULT_CSS_URL}"
/>

<style>
  html, body, #map { height: 100%; margin: 0; }
  /* Власні стилі іконок кластерів (ми перекриваємо дефолт) */
  .speed-cluster {
    border-radius: 50%;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 12px;
    box-shadow: 0 0 4px rgba(0,0,0,0.35);
    border: 2px solid #333;
    color: #fff;
    user-select: none;
  }
  .speed-cluster.red    { background: red; border-color:red; color:black;}
  .speed-cluster.yellow { background: yellow; border-color:yellow; color:black;}
  .speed-cluster.green  { background: green; border-color:green; color:black;}

  /* Легенда */
  .legend {
    position: absolute;
    bottom: 12px;
    left: 12px;
    background: rgba(255,255,255,0.9);
    padding: 8px 10px;
    border-radius: 6px;
    font: 13px/1.3 Arial, sans-serif;
    box-shadow: 0 0 4px rgba(0,0,0,0.25);
  }
  .legend .item {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
  }
  .legend .swatch {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    margin-right: 6px;
    border: 2px solid #333;
  }
  .legend .swatch.red { background:red; border-color:red; }
  .legend .swatch.yellow { background:#f0ad4e; border-color:#c8871d; }
  .legend .swatch.green { background:#5cb85c; border-color:#3f8f44; }
  .legend .caption { font-size:12px; }
</style>
</head>
<body>
<div id="map"></div>

<!-- Leaflet JS -->
<script src="${LEAFLET_JS_URL}"></script>
<!-- MarkerCluster JS -->
<script src="${MARKERCLUSTER_JS_URL}"></script>

<script>
/* ------------------ 0. Глобальні значення ------------------ */
const operator = ${JSON.stringify(operator)};
const t = (key, fallback = '') => fallback;
/* ------------------ 1. Параметри ------------------ */
const DISABLE_CLUSTER_ZOOM = ${DISABLE_CLUSTER_ZOOM}; // >= цього зума кластери вимикаються
const COLOR_RED    = 'red';
const COLOR_YELLOW = 'yellow';
const COLOR_GREEN  = 'green';

/* ------------------ 2. Допоміжні функції ------------------ */
${getColorBySpeedSrc}

${ensureColonSrc}

/* ------------------ 3. Дані ------------------ */
const data = ${safeData};
/* ------------------ 4. Ініціалізація карти ------------------ */
const map = L.map('map');
const mapMarkers = [];
const osm = L.tileLayer('${OSM_TILE_URL}', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
});
osm.addTo(map);

/* ------------------ 5. Функція створення іконки кластера ------------------ */
const makeClusterIconClass = (className) => cluster =>
  L.divIcon({
    html: \`<div class="speed-cluster \${className}\">\${cluster.getChildCount()}</div>\`,
    className: 'speed-cluster-wrapper',
    iconSize: [34, 34]
  });

/* ------------------ 6. Створення трьох кластерних груп ------------------ */
const redCluster = L.markerClusterGroup({
  disableClusteringAtZoom: DISABLE_CLUSTER_ZOOM,
  iconCreateFunction: makeClusterIconClass('red')
});
const yellowCluster = L.markerClusterGroup({
  disableClusteringAtZoom: DISABLE_CLUSTER_ZOOM,
  iconCreateFunction: makeClusterIconClass('yellow')
 });
const greenCluster = L.markerClusterGroup({
  disableClusteringAtZoom: DISABLE_CLUSTER_ZOOM,
  iconCreateFunction: makeClusterIconClass('green')
});

/* ------------------ 7. Додавання кластерів на карту ------------------ */
redCluster.addTo(map);
yellowCluster.addTo(map);
greenCluster.addTo(map);

/* ------------------ 8. Створення popup-контенту ------------------ */
${getMarkerPopupContentSrc}

/* ------------------ 9. Додавання маркерів ------------------ */
${addMapMarkerSrc}

/* ------------------ 10. Завантаження всіх точок ------------------ */
data.forEach(pt => addMapMarker(pt, false));

/* ------------------ 11. Авто-фокус на всіх маркерах ------------------ */
const coords = data
  .filter(p => p.latitude != null && p.longitude != null)
  .map(p => [p.latitude, p.longitude]);

if (coords.length > 0) {
  map.fitBounds(L.latLngBounds(coords).pad(0.05));
} else {
  map.setView(${JSON.stringify(MAP_FALLBACK_CENTER)}, 12);
}

/* ------------------ 12. Контроль шарів ------------------ */
const overlays = {
  "Швидкість завантаження = 0 Мбіт/с (червоні)"     : redCluster,
  "Швидкість завантаження до 2 Мбіт/с (жовті)"      : yellowCluster,
  "Швидкість завантаження більше 2 Мбіт/с (зелені)" : greenCluster
};
L.control.layers(null, overlays, { collapsed: true }).addTo(map);

</script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    saveBlob(blob, `${baseFileName}.html`);
    showNotification(t('htmlDownloaded', 'HTML файл завантажено!'));
}

window.downloadHTML = downloadHTML;
