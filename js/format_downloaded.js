function formatDownloaded(bytes) {
    const KB = 1024;
    const MB = KB * 1024;
    const GB = MB * 1024;
    const gbLabel = t('gbShort', 'GB');
    const mbLabel = t('mbShort', 'MB');
    const kbLabel = t('kbShort', 'KB');
    const bLabel = t('bShort', 'B');
    if (bytes >= GB) {
        const gb = Math.floor(bytes / GB);
        const remainder = bytes % GB;
        const mb = Math.floor(remainder / MB);
        const kb = Math.floor((remainder % MB) / KB);
        const b = remainder % KB;
        if (mb > 0) {
            return `${gb} ${gbLabel} ${mb} ${mbLabel}`;
        } else if (kb > 0) {
            return `${gb} ${gbLabel} ${kb} ${kbLabel}`;
        } else if (b > 0) {
            return `${gb} ${gbLabel} ${b} ${bLabel}`;
        }
        return `${gb} ${gbLabel}`;
    } else if (bytes >= MB) {
        const mb = Math.floor(bytes / MB);
        const remainder = bytes % MB;
        const kb = Math.floor(remainder / KB);
        const b = remainder % KB;
        if (kb > 0) {
            return `${mb} ${mbLabel} ${kb} ${kbLabel}`;
        } else if (b > 0) {
            return `${mb} ${mbLabel} ${b} ${bLabel}`;
        }
        return `${mb} ${mbLabel}`;
    } else if (bytes >= KB) {
        const kb = Math.floor(bytes / KB);
        const b = bytes % KB;
        if (b > 0) {
            return `${kb} ${kbLabel} ${b} ${bLabel}`;
        }
        return `${kb} ${kbLabel}`;
    }
    return `${bytes} ${bLabel}`;
}
