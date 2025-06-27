function downloadChart() {
    if (!speedChart) return;

    const link = document.createElement("a");
    link.download = `speed_chart_${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
    link.href = speedChart.toBase64Image();
    link.click();

    showNotification(t('chartExported', 'Графік експортовано!'));
}