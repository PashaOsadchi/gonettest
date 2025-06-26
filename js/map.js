// Map utilities using Leaflet
let map = null;
let mapMarkers = [];
let mapInitialized = false;

export function getColorBySpeed(speed) {
  if (speed <= 0) return 'red';
  if (speed <= 2) return 'yellow';
  return 'green';
}

export function initMap(speedData = []) {
  if (mapInitialized) return;
  map = L.map('map').setView([48.3794, 31.1656], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);
  mapInitialized = true;

  if (speedData.length > 0) {
    speedData.forEach(pt => addMapMarker(pt, false));
    const last = speedData[speedData.length - 1];
    if (last.latitude != null && last.longitude != null) {
      map.setView([last.latitude, last.longitude], map.getZoom());
    }
  }
}

export function initMapIfNeeded(speedData = []) {
  if (!mapInitialized) initMap(speedData);
}

export function setupMapObserver(speedData = []) {
  const mapEl = document.getElementById('map');
  if (!mapEl || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        initMapIfNeeded(speedData);
        obs.disconnect();
      }
    });
  });
  observer.observe(mapEl);
}

export function addMapMarker(point, centerOnAdd = true) {
  if (!map || point.latitude == null || point.longitude == null) return;
  const color = getColorBySpeed(point.speed);
  const marker = L.circleMarker([point.latitude, point.longitude], {
    radius: 6,
    color,
    fillColor: color,
    fillOpacity: 0.8
  }).addTo(map);
  mapMarkers.push(marker);
  if (centerOnAdd) {
    map.setView([point.latitude, point.longitude], map.getZoom());
  }
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
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
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export { map, mapMarkers, mapInitialized };
