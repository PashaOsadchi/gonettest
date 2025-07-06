// Wake Lock
let wakeLock = null;

async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', async () => {
            wakeLock = null;
            console.log('Wake Lock released');
            if (document.visibilityState === 'visible') {
                await requestWakeLock();
            }
        });
    } catch (err) {
        console.error('Wake Lock error:', err);
    }
}

document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});