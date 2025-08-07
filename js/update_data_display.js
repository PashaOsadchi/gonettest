function updateDataDisplay() {
    const dataDisplay = document.getElementById("dataDisplay");
    if (!dataDisplay) return;

    const lastRecords = speedData.slice(-10).reverse();

    if (lastRecords.length === 0) {
        dataDisplay.innerHTML =
            `<div class="placeholder">${t('noData', 'Немає даних')}</div>`;
        return;
    }

    dataDisplay.innerHTML = lastRecords
        .map(
            (record) => `
                <div class="data-row">
                    <div>${record.timestamp}</div>
                    <div>${record.speed.toFixed(2)}</div>
                    <div>${record.latitude != null ? record.latitude.toFixed(6) : "N/A"}</div>
                    <div>${record.longitude != null ? record.longitude.toFixed(6) : "N/A"}</div>
                    <div>${record.altitude != null ? record.altitude.toFixed(1) : "N/A"}</div>
                    <div>${record.gpsSpeed != null ? record.gpsSpeed.toFixed(1) : "N/A"}</div>
                    <div>${record.distance !== undefined ? record.distance.toFixed(1) : "N/A"}</div>
                    <div>${record.region || 'N/A'}</div>
                    <div>${record.rayon || 'N/A'}</div>
                    <div>${record.hromada || 'N/A'}</div>
                    <div>${record.roadRef || 'N/A'}</div>
                </div>
            `
        )
        .join("");
}
