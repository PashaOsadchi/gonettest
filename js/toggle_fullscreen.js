function toggleFullscreen() {
    const body = document.body;
    isFullscreen = !isFullscreen;

    if (isFullscreen) {
        body.classList.add("fullscreen-mode");
        if (body.requestFullscreen) {
            body.requestFullscreen();
        } else if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        }
        showNotification(t('fullscreenEnabled', 'Повноекранний режим увімкнено'));
        setTimeout(() => {
            if (speedChart) {
                speedChart.resize();
            }
        }, ORIENTATION_DELAY);
    } else {
        body.classList.remove("fullscreen-mode");
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        showNotification(t('fullscreenDisabled', 'Повноекранний режим вимкнено'));
        setTimeout(() => {
            if (speedChart) {
                speedChart.resize();
            }
        }, ORIENTATION_DELAY);
    }
}