function zoomTo18() {
    if (typeof initMapIfNeeded === 'function') {
        initMapIfNeeded();
    }
    if (map) {
        map.setZoom(18);
    }
}
