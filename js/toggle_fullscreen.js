function resizeChartDelayed() {
    setTimeout(() => {
        if (speedChart) {
            speedChart.resize();
        }
    }, ORIENTATION_DELAY);
}

function toggleFullscreen() {
    const body = document.body;

    if (!isFullscreen) {
        const target = (body.requestFullscreen || body.webkitRequestFullscreen || body.mozRequestFullScreen || body.msRequestFullscreen) ? body : document.documentElement;
        const request = target.requestFullscreen || target.webkitRequestFullscreen || target.mozRequestFullScreen || target.msRequestFullscreen;
        if (!request) {
            isFullscreen = false;
            showNotification(t('fullscreenEnableFailed', 'Не вдалося увімкнути повноекранний режим'));
            console.error('Fullscreen API is not supported');
            return;
        }
        Promise.resolve(request.call(target))
            .then(() => {
                isFullscreen = true;
                body.classList.add("fullscreen-mode");
                showNotification(t('fullscreenEnabled', 'Повноекранний режим увімкнено'));
                resizeChartDelayed();
            })
            .catch((err) => {
                isFullscreen = false;
                showNotification(t('fullscreenEnableFailed', 'Не вдалося увімкнути повноекранний режим'));
                console.error('Failed to enter fullscreen', err);
            });
    } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
        if (!exit) {
            isFullscreen = true;
            showNotification(t('fullscreenDisableFailed', 'Не вдалося вимкнути повноекранний режим'));
            console.error('Fullscreen API is not supported');
            return;
        }
        Promise.resolve(exit.call(document))
            .then(() => {
                isFullscreen = false;
                body.classList.remove("fullscreen-mode");
                showNotification(t('fullscreenDisabled', 'Повноекранний режим вимкнено'));
                resizeChartDelayed();
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
        resizeChartDelayed();
    }
});
