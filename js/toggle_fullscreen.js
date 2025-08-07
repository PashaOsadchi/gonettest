function toggleFullscreen() {
    const body = document.body;

    if (!isFullscreen) {
        const target = body.requestFullscreen ? body : document.documentElement;
        target.requestFullscreen()
            .then(() => {
                isFullscreen = true;
                body.classList.add("fullscreen-mode");
                showNotification(t('fullscreenEnabled', 'Повноекранний режим увімкнено'));
                setTimeout(() => {
                    if (speedChart) {
                        speedChart.resize();
                    }
                }, ORIENTATION_DELAY);
            })
            .catch((err) => {
                isFullscreen = false;
                showNotification(t('fullscreenEnableFailed', 'Не вдалося увімкнути повноекранний режим'));
                console.error('Failed to enter fullscreen', err);
            });
    } else {
        document.exitFullscreen()
            .then(() => {
                isFullscreen = false;
                body.classList.remove("fullscreen-mode");
                showNotification(t('fullscreenDisabled', 'Повноекранний режим вимкнено'));
                setTimeout(() => {
                    if (speedChart) {
                        speedChart.resize();
                    }
                }, ORIENTATION_DELAY);
            })
            .catch((err) => {
                isFullscreen = true;
                showNotification(t('fullscreenDisableFailed', 'Не вдалося вимкнути повноекранний режим'));
                console.error('Failed to exit fullscreen', err);
            });
    }
}

// Sync isFullscreen with actual fullscreen state
document.addEventListener('fullscreenchange', () => {
    const fullscreen = !!document.fullscreenElement;
    if (fullscreen !== isFullscreen) {
        isFullscreen = fullscreen;
        document.body.classList.toggle('fullscreen-mode', fullscreen);
        setTimeout(() => {
            if (speedChart) {
                speedChart.resize();
            }
        }, ORIENTATION_DELAY);
    }
});
