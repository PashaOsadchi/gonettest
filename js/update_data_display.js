function updateDataDisplay() {
    const dataDisplay = document.getElementById("dataDisplay");
    if (!dataDisplay) return;

    const lastRecords = speedData.slice(-10).reverse();

    dataDisplay.textContent = "";

    if (lastRecords.length === 0) {
        const placeholder = document.createElement("div");
        placeholder.className = "placeholder";
        placeholder.textContent = t("noData", "Немає даних");
        dataDisplay.appendChild(placeholder);
        return;
    }

    const fragment = document.createDocumentFragment();

    lastRecords.forEach((record) => {
        const row = document.createElement("div");
        row.className = "data-row";

        const timestamp = document.createElement("div");
        timestamp.textContent = record.timestamp;
        row.appendChild(timestamp);

        const speed = document.createElement("div");
        speed.textContent = record.speed.toFixed(2);
        row.appendChild(speed);

        const latitude = document.createElement("div");
        latitude.textContent =
            record.latitude != null ? record.latitude.toFixed(6) : "N/A";
        row.appendChild(latitude);

        const longitude = document.createElement("div");
        longitude.textContent =
            record.longitude != null ? record.longitude.toFixed(6) : "N/A";
        row.appendChild(longitude);

        const altitude = document.createElement("div");
        altitude.textContent =
            record.altitude != null ? record.altitude.toFixed(1) : "N/A";
        row.appendChild(altitude);

        const gpsSpeed = document.createElement("div");
        gpsSpeed.textContent =
            record.gpsSpeed != null ? record.gpsSpeed.toFixed(1) : "N/A";
        row.appendChild(gpsSpeed);

        const distance = document.createElement("div");
        distance.textContent =
            record.distance !== undefined ? record.distance.toFixed(1) : "N/A";
        row.appendChild(distance);

        const region = document.createElement("div");
        region.textContent = record.region || "N/A";
        row.appendChild(region);

        const rayon = document.createElement("div");
        rayon.textContent = record.rayon || "N/A";
        row.appendChild(rayon);

        const hromada = document.createElement("div");
        hromada.textContent = record.hromada || "N/A";
        row.appendChild(hromada);

        const roadRef = document.createElement("div");
        roadRef.textContent = record.roadRef || "N/A";
        row.appendChild(roadRef);

        fragment.appendChild(row);
    });

    dataDisplay.appendChild(fragment);
}
