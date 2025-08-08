function buildBaseFileName(speedData, operator) {
    const lastRecord = Array.isArray(speedData)
        ? speedData[speedData.length - 1]
        : null;
    let dateStr = '';
    let timeStr = '';
    if (lastRecord && lastRecord.fullTimestamp) {
        ({ dateStr, timeStr } = formatTimestamp(lastRecord.fullTimestamp, {
            forFilename: true,
            dateSeparator: '.',
            timeSeparator: '-',
        }));
    }
    return `${replaceSpacesWithUnderscore(operator)}_${dateStr}_${timeStr}`;
}
