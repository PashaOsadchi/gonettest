function formatDownloaded(bytes) {
    const MB = 1024 * 1024;
    const GB = MB * 1024;
    if (bytes >= GB) {
        const gb = Math.floor(bytes / GB);
        const mb = Math.floor((bytes % GB) / MB);
        return `${gb} GB ${mb} MB`;
    } else {
        const mb = Math.floor(bytes / MB);
        return `${mb} MB`;
    }
}