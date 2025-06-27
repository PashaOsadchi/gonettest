function addLog(msg) {
    console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function logTestSummary() {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const downloadedFormatted = formatDownloaded(totalBytes);
    const avg = speedStats.count
        ? (speedStats.sum / speedStats.count).toFixed(2)
        : "0.00";
    const min = speedStats.min === Infinity ? 0 : speedStats.min;
    addLog(
        `Результати тесту: час ${elapsed} с, дані ${downloadedFormatted}, ` +
            `середня швидкість ${avg} Мбіт/с, ` +
            `макс ${speedStats.max.toFixed(2)} Мбіт/с, ` +
            `мін ${min === 0 ? "0.00" : min.toFixed(2)} Мбіт/с`
    );
}