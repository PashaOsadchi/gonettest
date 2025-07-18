function formatDownloaded(bytes) {
    const KB = 1024;
    const MB = KB * 1024;
    const GB = MB * 1024;

    if (bytes >= GB) {
        const gb = Math.floor(bytes / GB);
        const mb = Math.floor((bytes % GB) / MB);
        return `${gb} GB ${mb} MB`;
    }

    if (bytes >= MB) {
        const mb = (bytes / MB).toFixed(2);
        return `${mb} MB`;
    }

    if (bytes >= KB) {
        const kb = Math.round(bytes / KB);
        return `${kb} KB`;
    }

    return `${bytes} B`;
}
