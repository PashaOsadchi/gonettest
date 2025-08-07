function zoomTo18() {
    if (typeof initMapIfNeeded === 'function') {
        initMapIfNeeded();
    }
    if (map && typeof map.setZoom === 'function') {
        map.setZoom(18);
    } else {
        console.warn('Map instance або метод setZoom відсутні');
    }
}
