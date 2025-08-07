function downloadChart() {
    if (!speedChart) return;

    try {
        const link = document.createElement("a");
        link.download = `speed_chart_${new Date()
            .toISOString()
            .slice(0, 10)}.png`;
        link.href = speedChart.toBase64Image();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification(t('chartExported', 'Графік експортовано!'));
    } catch (e) {
        showNotification(
            t('chartExportError', 'Не вдалося експортувати графік')
        );
    }
}
