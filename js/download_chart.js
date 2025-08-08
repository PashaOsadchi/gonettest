async function downloadChart() {
    if (!speedChart) return;

    try {
        const dataUrl = speedChart.toBase64Image();
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        saveBlob(
            blob,
            `speed_chart_${new Date().toISOString().slice(0, 10)}.png`
        );
        showNotification(t('chartExported', 'Графік експортовано!'));
    } catch (e) {
        showNotification(
            t('chartExportError', 'Не вдалося експортувати графік')
        );
    }
}
