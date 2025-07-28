function getDistanceToLastPoint(lat, lon) {
    if (!lastSavedGPSData.latitude || !lastSavedGPSData.longitude) {
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

