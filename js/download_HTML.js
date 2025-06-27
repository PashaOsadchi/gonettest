function downloadHTML() {
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
        timeStr = ts.toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }

    const baseFileName = `${replaceSpacesWithUnderscore(operator)}_${dateStr}_${timeStr}`;

    let center = [48.3794, 31.1656];
    for (let i = speedData.length - 1; i >= 0; i--) {
        const pt = speedData[i];
        if (pt.latitude != null && pt.longitude != null) {
            center = [pt.latitude, pt.longitude];
            break;
        }
    }

    const addMapMarkerSrc = window.addMapMarker.toString();
    const getColorSrc = window.getColorBySpeed.toString();
    const popupSrc = window.getMarkerPopupContent.toString();

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${baseFileName}</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>#map{height:100vh;width:100%;margin:0;}</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    function t(key, fallback = '') { return fallback; }
    const data = ${JSON.stringify(speedData)};
    ${getColorSrc}
    ${popupSrc}
    ${addMapMarkerSrc}
    let mapMarkers = [];
    const map = L.map('map').setView([${center[0]}, ${center[1]}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);
    data.forEach(pt => addMapMarker(pt, false));
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${baseFileName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(t('htmlDownloaded', 'HTML файл завантажено!'));
}