// Data export utilities
const ICON_RED = 'http://maps.google.com/mapfiles/kml/paddle/red-circle.png';
const ICON_YELLOW = 'http://maps.google.com/mapfiles/kml/paddle/ylw-circle.png';
const ICON_GREEN = 'http://maps.google.com/mapfiles/kml/paddle/grn-circle.png';

function replaceSpacesWithUnderscore(str) {
  return str.replace(/ /g, '_');
}

export function downloadData(speedData, operator) {
  if (speedData.length === 0) {
    window.showNotification && window.showNotification('Немає даних для завантаження');
    return;
  }
  let dateStr = '';
  let timeStr = '';
  const headers =
    'Часова мітка (мс);' +
    'Дата;' +
    'Час;' +
    'Оператор;' +
    'Швидкість (Мбіт/с);' +
    'Завантажено (МБ);' +
    'Тривалість (с);' +
    'Широта;' +
    'Довгота;' +
    'Висота (м);' +
    'GPS Швидкість (км/год);' +
    'Точність (м);' +
    'Напрямок (°)\n';

  const csvContent =
    headers +
    speedData
      .map((record) => {
        const ts = record.fullTimestamp instanceof Date ? record.fullTimestamp : new Date(record.fullTimestamp);
        dateStr = ts.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
        timeStr = ts.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return (
          `${ts.getTime()};` +
          `${dateStr};` +
          `${timeStr};` +
          `${operator};` +
          `${record.speed.toFixed(2)};` +
          `${record.downloaded.toFixed(2)};` +
          `${record.elapsed || ''};` +
          `${record.latitude || ''};` +
          `${record.longitude || ''};` +
          `${record.altitude ? record.altitude.toFixed(0) : ''};` +
          `${record.gpsSpeed ? record.gpsSpeed.toFixed(1) : ''};` +
          `${record.accuracy ? record.accuracy.toFixed(1) : ''};` +
          `${record.heading ? record.heading.toFixed(1) : ''};`
        );
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${replaceSpacesWithUnderscore(operator)}_${dateStr}_${timeStr}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.showNotification && window.showNotification('Дані завантажено!');
}

export function downloadKML(speedData, operator) {
  if (speedData.length === 0) {
    window.showNotification && window.showNotification('Немає даних для завантаження');
    return;
  }
  let dateStr = '';
  let timeStr = '';
  const lastRecord = speedData[speedData.length - 1];
  if (lastRecord && lastRecord.fullTimestamp) {
    const ts = lastRecord.fullTimestamp instanceof Date ? lastRecord.fullTimestamp : new Date(lastRecord.fullTimestamp);
    dateStr = ts.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    timeStr = ts.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  const baseFileName = `${replaceSpacesWithUnderscore(operator)}_${dateStr}_${timeStr}`;
  let kmlContent =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<kml xmlns="http://www.opengis.net/kml/2.2">\n' +
    '<Document>\n' +
    `<name>${baseFileName}</name>\n` +
    `<Style id="red"><IconStyle><Icon><href>${ICON_RED}</href></Icon></IconStyle></Style>\n` +
    `<Style id="yellow"><IconStyle><Icon><href>${ICON_YELLOW}</href></Icon></IconStyle></Style>\n` +
    `<Style id="green"><IconStyle><Icon><href>${ICON_GREEN}</href></Icon></IconStyle></Style>\n`;

  speedData.forEach((record, idx) => {
    if (record.latitude == null || record.longitude == null) return;
    const altitude = record.altitude ? record.altitude.toFixed(1) : '0';
    const ts = record.fullTimestamp instanceof Date ? record.fullTimestamp : new Date(record.fullTimestamp);
    const dateStr = ts.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = ts.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const description =
      `Часова мітка (мс): ${ts.getTime()}<br>` +
      `Дата: ${dateStr}<br>` +
      `Час: ${timeStr}<br>` +
      `Оператор: ${operator}<br>` +
      `Швидкість (Мбіт/с): ${record.speed.toFixed(2)}<br>` +
      `Завантажено (МБ): ${record.downloaded.toFixed(2)}<br>` +
      `Тривалість (с): ${record.elapsed ?? ''}<br>` +
      `Широта: ${record.latitude}<br>` +
      `Довгота: ${record.longitude}<br>` +
      `Висота (м): ${altitude}<br>` +
      `GPS Швидкість (км/год): ${record.gpsSpeed ? record.gpsSpeed.toFixed(1) : ''}<br>` +
      `Точність (м): ${record.accuracy ? record.accuracy.toFixed(1) : ''}<br>` +
      `Напрямок (°): ${record.heading ? record.heading.toFixed(1) : ''}`;

    let style = '#green';
    if (record.speed === 0) style = '#red';
    else if (record.speed > 0 && record.speed <= 2) style = '#yellow';
    kmlContent +=
      `<Placemark>` +
      `<name>${idx + 1}</name>` +
      `<styleUrl>${style}</styleUrl>` +
      `<description><![CDATA[${description}]]></description>` +
      `<Point><coordinates>${record.longitude},${record.latitude},${altitude}</coordinates></Point>` +
      `</Placemark>\n`;
  });

  kmlContent += '</Document>\n</kml>';
  const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${baseFileName}.kml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.showNotification && window.showNotification('KML файл завантажено!');
}

export function downloadHTML(speedData, operator) {
  if (speedData.length === 0) {
    alert('Немає даних для завантаження');
    return;
  }
  let dateStr = '';
  let timeStr = '';
  const lastRecord = speedData[speedData.length - 1];
  if (lastRecord && lastRecord.fullTimestamp) {
    const ts = lastRecord.fullTimestamp instanceof Date ? lastRecord.fullTimestamp : new Date(lastRecord.fullTimestamp);
    dateStr = ts.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    timeStr = ts.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
    const data = ${JSON.stringify(speedData)};
    function getColor(s){ if(s <= 0) return 'red'; if(s <= 2) return 'yellow'; return 'green'; }
    const map = L.map('map').setView([${center[0]}, ${center[1]}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);
    data.forEach(pt => {
      if(pt.latitude == null || pt.longitude == null) return;
      const color = getColor(pt.speed);
      L.circleMarker([pt.latitude, pt.longitude], {radius:6, color, fillColor:color, fillOpacity:0.8}).addTo(map);
    });
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
  window.showNotification && window.showNotification('HTML файл завантажено!');
}

export function exportChart(chart) {
  if (!chart) return;
  const link = document.createElement('a');
  link.download = `speed_chart_${new Date().toISOString().slice(0, 10)}.png`;
  link.href = chart.toBase64Image();
  link.click();
  window.showNotification && window.showNotification('Графік експортовано!');
}
