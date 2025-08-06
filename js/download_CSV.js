function downloadCSV() {
    if (isDownloading) return;

    if (speedData.length === 0) {
        showNotification(t('noData', 'Немає даних для завантаження'));
        return;
    }

    isDownloading = true;
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.disabled = true;

    let dateStr = '';
    let timeStr = '';

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
        "Завантажено (МБ);" +
        "Тривалість (с);" +
        "Широта;" +
        "Довгота;" +
        "Висота (м);" +
        "GPS Швидкість (км/год);" +
        "Відстань (м);" +
        "Точність (м);" +
        "Напрямок (°)\n";

    const csvContent =
        headers +
        speedData
            .map((record) => {
                // Перевірка, якщо зберігали Date – використовуємо напряму, інакше створюємо об’єкт Date
                const ts =
                    record.fullTimestamp instanceof Date
                        ? record.fullTimestamp
                        : new Date(record.fullTimestamp);

                // Формати дати й часу з 2-цифровими компонентами
                dateStr = ts.toLocaleDateString("uk-UA", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                });
                timeStr = ts.toLocaleTimeString("uk-UA", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                });

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
                    `${record.downloadedDelta.toFixed(2)};` +
                    `${record.elapsed || ""};` +
                    `${record.latitude || ""};` +
                    `${record.longitude || ""};` +
                    `${record.altitude ? record.altitude.toFixed(0) : ""};` +
                    `${record.gpsSpeed ? record.gpsSpeed.toFixed(1) : ""};` +
                    `${record.distance ? record.distance.toFixed(1) : ""};` +
                    `${record.accuracy ? record.accuracy.toFixed(1) : ""};` +
                    `${record.heading ? record.heading.toFixed(1) : ""};`
                );
            })
            .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${replaceSpacesWithUnderscore(operator)}_${dateStr}_${timeStr}.csv`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(t('dataDownloaded', 'Дані завантажено!'));

    if (downloadBtn) downloadBtn.disabled = false;
    isDownloading = false;
}