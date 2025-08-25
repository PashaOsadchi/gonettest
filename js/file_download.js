function saveBlob(blob, fileName) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    // Delay cleanup to prevent large file downloads from failing if the URL
    // is revoked before the download fully starts.
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
    }, 0);
}
