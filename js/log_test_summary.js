function logTestSummary() {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const downloadedFormatted = formatDownloaded(totalBytes);
    const avg = speedStats.count
        ? (speedStats.sum / speedStats.count).toFixed(2)
        : "0.00";
    const min = speedStats.min === Infinity ? 0 : speedStats.min;
    const secLabel = t('secondsShort', 'с');
    const speedUnit = t('mbpsShort', 'Мбіт/с');
    addLog(
        `${t('testResults', 'Результати тесту')}: ` +
            `${t('testResultsTime', 'час')} ${elapsed} ${secLabel}, ` +
            `${t('testResultsData', 'дані')} ${downloadedFormatted}, ` +
            `${t('testResultsAvgSpeed', 'середня швидкість')} ${avg} ${speedUnit}, ` +
            `${t('testResultsMax', 'макс')} ${speedStats.max.toFixed(2)} ${speedUnit}, ` +
            `${t('testResultsMin', 'мін')} ${
                min === 0 ? '0.00' : min.toFixed(2)
            } ${speedUnit}`
    );
}