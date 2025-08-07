function getDistanceToLastPoint(lat, lon) {
    if (lastSavedGPSData.latitude == null || lastSavedGPSData.longitude == null) {
        if (typeof addLog === "function") {
            addLog("getDistanceToLastPoint: missing last GPS data");
        }
        return 0;
    }
    if (lat == null || lon == null) {
        if (typeof addLog === "function") {
            addLog(`getDistanceToLastPoint: invalid coordinates lat=${lat}, lon=${lon}`);
        }
        return 0;
    }
    const distance = calculateDistance(
        lastSavedGPSData.latitude,
        lastSavedGPSData.longitude,
        lat,
        lon
    );
    // Ignore points farther than MAX_POINT_DISTANCE meters to avoid GPS glitches
    return distance <= MAX_POINT_DISTANCE ? distance : 0;
}

window.getDistanceToLastPoint = getDistanceToLastPoint;

