// js/speed_camera_announcer.js

let speedCameras = null;
let lastCamera = null;
let lastDistance = Infinity;

async function loadSpeedCameras() {
    if (speedCameras) return;
    const resp = await fetch(SPEED_CAMERA_FILE);
    speedCameras = await resp.json();
}

async function checkSpeedCameraProximity() {
    if (!settings.voiceSpeedCameraApproach) return;
    if (
        !Number.isFinite(currentGPSData.latitude) ||
        !Number.isFinite(currentGPSData.longitude)
    ) {
        return;
    }

    if (!speedCameras) {
        try {
            await loadSpeedCameras();
        } catch (e) {
            console.error('Failed to load speed cameras', e);
            return;
        }
    }

    let nearest = null;
    let minDist = Infinity;

    for (const camera of speedCameras) {
        const dist = calculateDistance(
            currentGPSData.latitude,
            currentGPSData.longitude,
            camera["Широта"],
            camera["Довгота"]
        );
        if (dist < minDist) {
            minDist = dist;
            nearest = camera;
        }
    }

    if (!nearest) return;

    if (lastCamera !== nearest) {
        lastCamera = nearest;
        lastDistance = minDist;
        return;
    }

    if (minDist < lastDistance) {
        for (const threshold of [1000, 500, 100]) {
            if (lastDistance > threshold && minDist <= threshold) {
                speak(
                    `Через ${Math.round(minDist)} метрів обмеження швидкості у ${nearest["Максимальна швидкість"]}`
                );
                break;
            }
        }
    }

    lastDistance = minDist;
}

window.checkSpeedCameraProximity = checkSpeedCameraProximity;

