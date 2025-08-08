function formatTimestamp(ts, options = {}) {
    const {
        locale = 'uk-UA',
        forFilename = false,
        dateSeparator = forFilename ? '-' : '.',
        timeSeparator = forFilename ? '-' : ':',
    } = options;

    const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

    const dateObj = ts instanceof Date ? ts : new Date(ts);

    let dateStr = dateObj.toLocaleDateString(locale, dateOptions);
    let timeStr = dateObj.toLocaleTimeString(locale, timeOptions);

    if (forFilename) {
        dateStr = dateStr.replace(/[^0-9]+/g, dateSeparator);
        timeStr = timeStr.replace(/[^0-9]+/g, timeSeparator);
    }

    return { dateStr, timeStr };
}

