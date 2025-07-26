function downloadHTML() {
    if (!Array.isArray(speedData)) {
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

    if (speedData.length === 0) {
        showNotification(t('noData', 'Немає даних для завантаження'));
        return;
    }

    let dateStr = '';
    let timeStr = '';
    const lastRecord = speedData[speedData.length - 1];
    if (lastRecord && lastRecord.fullTimestamp) {
        const ts =
            lastRecord.fullTimestamp instanceof Date
                ? lastRecord.fullTimestamp
                : new Date(lastRecord.fullTimestamp);
        dateStr = ts.toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
        timeStr = ts
            .toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            })
            .replace(/:/g, '-');
    }

    const baseFileName = `${replaceSpacesWithUnderscore(operator)}_${dateStr}_${timeStr}`;

    const safeData = JSON.stringify(speedData).replace(/<\/script>/g, '<\\/script>');

    const htmlContent = `
<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="utf-8">
<title>Кластери швидкості (окремо за кольорами)</title>

<!-- Leaflet CSS -->
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
/>

<!-- MarkerCluster CSS -->
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"
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
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<!-- MarkerCluster JS -->
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>

<script>
/* ------------------ 1. Параметри ------------------ */
const DISABLE_CLUSTER_ZOOM = 18; // >= цього зума кластери вимикаються
const COLOR_RED    = 'red';
const COLOR_YELLOW = 'yellow';
const COLOR_GREEN  = 'green';

/* ------------------ 2. Функція кольору за швидкістю ------------------ */
function getColorBySpeed(speed) {
  if (speed <= 0) return COLOR_RED;
  if (speed <= 2) return COLOR_YELLOW;
  return COLOR_GREEN;
}

/* ------------------ 3. Дані ------------------ */
const data = ${safeData};
    /* ------------------ 4. Ініціалізація карти ------------------ */
const map = L.map('map');
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
});
osm.addTo(map);

/* ------------------ 5. Функція створення іконки кластера ------------------ */
const makeClusterIconClass = (className) => cluster =>
  L.divIcon({
    html: \`<div class="speed-cluster ${className}\">${cluster.getChildCount()}</div>\`,
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
function getMarkerPopupContent(point) {
  return \`
    <div style="min-width:150px">
      <strong>Час:</strong> ${point.fullTimestamp || ''}<br/>
      <strong>Швидкість:</strong> ${point.speed != null ? point.speed.toFixed(2) : '—'} Мбіт/с
    </div>
  \`;
}

/* ------------------ 9. Додавання маркерів ------------------ */
function addMapMarker(point) {
  if (point.latitude == null || point.longitude == null) return;
  const color = getColorBySpeed(point.speed);

  const marker = L.circleMarker([point.latitude, point.longitude], {
    radius: 18,
    color: color,
    weight: 2,
    fillColor: color,
    fillOpacity: 0.85
  });

  marker.bindPopup(getMarkerPopupContent(point));
  marker.options.speedValue = point.speed;
  marker.options.speedColor = color;

  if (color === COLOR_RED) {
    redCluster.addLayer(marker);
  } else if (color === COLOR_YELLOW) {
    yellowCluster.addLayer(marker);
  } else {
    greenCluster.addLayer(marker);
  }
}

/* ------------------ 10. Завантаження всіх точок ------------------ */
data.forEach(pt => addMapMarker(pt));

/* ------------------ 11. Авто-фокус на всіх маркерах ------------------ */
const coords = data
  .filter(p => p.latitude != null && p.longitude != null)
  .map(p => [p.latitude, p.longitude]);

if (coords.length > 0) {
  map.fitBounds(L.latLngBounds(coords).pad(0.05));
} else {
  map.setView([50.45, 30.52], 12);
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
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${baseFileName}.html`;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);

    showNotification(t('htmlDownloaded', 'HTML файл завантажено!'));
}
