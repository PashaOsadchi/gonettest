function getDistanceToLastPoint(lat, lon) {
    if (lastSavedGPSData.latitude == null || lastSavedGPSData.longitude == null) {
        return 0;
    }
    if (lat == null || lon == null) {
        return 0;
    }
    const distance = calculateDistance(
        lastSavedGPSData.latitude,
        lastSavedGPSData.longitude,
        lat,
        lon
    );
    return distance <= 100 ? distance : 0;
}

window.getDistanceToLastPoint = getDistanceToLastPoint;

