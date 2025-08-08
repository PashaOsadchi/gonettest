export function getColorBySpeed(speed) {
    if (speed <= 0) return 'red';
    if (speed <= 2) return 'yellow';
    return 'green';
}

export function ensureColon(label) {
    return label.endsWith(':') ? label : label + ':';
}

export function addMapMarker(point, centerOnAdd = true) {
    if (!map || point.latitude == null || point.longitude == null) return;
    const color = getColorBySpeed(point.speed);
    const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: 6,
        color,
        fillColor: color,
        fillOpacity: 0.8,
    });

    if (color === 'red' && redCluster) {
        redCluster.addLayer(marker);
    } else if (color === 'yellow' && yellowCluster) {
        yellowCluster.addLayer(marker);
    } else if (greenCluster) {
        greenCluster.addLayer(marker);
    } else {
        marker.addTo(map);
    }
    if (typeof window.getMarkerPopupContent === 'function' && typeof marker.bindPopup === 'function') {
        marker.bindPopup(window.getMarkerPopupContent(point), { autoPan: false });
    }
    mapMarkers.push(marker);
    if (centerOnAdd) {
        let openPopup = null;
        if (typeof map.getPopup === 'function') {
            openPopup = map.getPopup();
        } else if (typeof map.eachLayer === 'function') {
            map.eachLayer(layer => {
                if (
                    !openPopup &&
                    layer instanceof L.Popup &&
                    typeof layer.isOpen === 'function' &&
                    layer.isOpen()
                ) {
                    openPopup = layer;
                }
            });
        }
        if (!(openPopup && map.hasLayer(openPopup))) {
            map.setView([point.latitude, point.longitude], map.getZoom());
        }
    }
}
