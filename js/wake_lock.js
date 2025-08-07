// Wake Lock
let wakeLock = null;

export async function requestWakeLock() {
    if (!('wakeLock' in navigator)) {
        console.warn('Wake Lock API not supported');
        return;
    }

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

if (typeof window !== 'undefined') {
    window.requestWakeLock = requestWakeLock;
}
