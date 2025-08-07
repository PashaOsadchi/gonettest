function formatDownloaded(bytes) {
    const MB = 1024 * 1024;
    const GB = MB * 1024;
    const gbLabel = t('gbShort', 'GB');
    const mbLabel = t('mbShort', 'MB');
    if (bytes >= GB) {
        const gb = Math.floor(bytes / GB);
        const mb = Math.floor((bytes % GB) / MB);
        return `${gb} ${gbLabel} ${mb} ${mbLabel}`;
    } else {
        const mb = Math.floor(bytes / MB);
        return `${mb} ${mbLabel}`;
    }
}