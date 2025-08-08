function downloadCSV() {
    if (isDownloading) return;

    if (!ensureSpeedData()) return;

    isDownloading = true;
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.disabled = true;

    try {
        // ✨  Додали три нові заголовки після "Час" та колонку "Відстань" після "GPS Швидкість"
        const headers =
            "Часова мітка (мс);" +
            "Дата;" +
            "Час;" +
            "Область;" +
            "Район;" +
            "Громада;" +
            "Дорога;" +
            "Оператор;" +
            "Швидкість (Мбіт/с);" +
            "Сумарно завантажено (МБ);" +
            "Тривалість (с);" +
            "Широта;" +
            "Довгота;" +
            "Висота (м);" +
            "GPS Швидкість (км/год);" +
            "Відстань (м);" +
            "Точність (м);" +
            "Напрямок (°)\n";

        let cumulative = 0;
        const csvContent =
            headers +
            speedData
                .map((record) => {
                    const ts =
                        record.fullTimestamp instanceof Date
                            ? record.fullTimestamp
                            : new Date(record.fullTimestamp);

                    const { dateStr, timeStr } = formatTimestamp(ts);

                    return (
                        `${ts.getTime()};` +                       // Часова мітка (мс)
                        `${dateStr};` +                           // Дата
                        `${timeStr};` +                           // Час (HH:MM:SS)
                        `${record.region || ""};` +
                        `${record.rayon || ""};` +
                        `${record.hromada || ""};` +
                        `${record.roadRef || ""};` +
                        `${operator};` +
                        `${record.speed.toFixed(2)};` +
                        `${(cumulative += record.downloadedDelta).toFixed(2)};` +
                        `${record.elapsed ?? ""};` +
                        `${record.latitude ?? ""};` +
                        `${record.longitude ?? ""};` +
                        `${record.altitude !== null && record.altitude !== undefined ? record.altitude.toFixed(0) : ""};` +
                        `${record.gpsSpeed !== null && record.gpsSpeed !== undefined ? record.gpsSpeed.toFixed(1) : ""};` +
                        `${record.distance !== null && record.distance !== undefined ? record.distance.toFixed(1) : ""};` +
                        `${record.accuracy !== null && record.accuracy !== undefined ? record.accuracy.toFixed(1) : ""};` +
                        `${record.heading !== null && record.heading !== undefined ? record.heading.toFixed(1) : ""};`
                    );
                })
                .join("\n");

        const baseFileName = buildBaseFileName(speedData, operator);

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        saveBlob(blob, `${baseFileName}.csv`);
        showNotification(t('dataDownloaded', 'Дані завантажено!'));
    } finally {
        if (downloadBtn) downloadBtn.disabled = false;
        isDownloading = false;
    }
}
