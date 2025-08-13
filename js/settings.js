function toggleSettings() {
    const panel = document.getElementById("settingsPanel");
    if (!panel) {
        console.warn("settingsPanel element not found");
        return;
    }
    const shouldOpen = !panel.classList.contains("active");
    panel.classList.toggle("active");

    // Reload settings when panel is opened to show latest state
    if (shouldOpen) {
        loadSettingsFromStorage();
        loadSettings();
    }
}

const SETTINGS_STORAGE_KEY = 'settings';

function loadSettingsFromStorage() {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return;
    try {
        const loaded = JSON.parse(stored);
        Object.assign(settings, loaded);
    } catch (e) {
        console.error('Failed to parse stored settings', e);
    }
}

function saveSettings() {
    const panel = document.getElementById("settingsPanel");
    if (!panel) {
        console.warn("settingsPanel element not found");
        return;
    }

    const soundAlerts = panel.querySelector("#soundAlerts");
    const voiceAlerts = panel.querySelector("#voiceAlerts");
    const voiceHromadaChange = panel.querySelector("#voiceHromadaChange");
    const voiceRoadChange = panel.querySelector("#voiceRoadChange");
    const showHromady = panel.querySelector("#showHromady");
    const showInternationalRoads = panel.querySelector("#showInternationalRoads");
    const showNationalRoads = panel.querySelector("#showNationalRoads");
    const showRegionalRoads = panel.querySelector("#showRegionalRoads");
    const showTerritorialRoads = panel.querySelector("#showTerritorialRoads");
    const showSpeedCameras = panel.querySelector("#showSpeedCameras");
    const langSelect = panel.querySelector("#languageSelect");

    if (soundAlerts) settings.soundAlerts = soundAlerts.checked; else console.warn("soundAlerts element not found");
    if (voiceAlerts) settings.voiceAlerts = voiceAlerts.checked; else console.warn("voiceAlerts element not found");
    if (voiceHromadaChange) settings.voiceHromadaChange = voiceHromadaChange.checked; else console.warn("voiceHromadaChange element not found");
    if (voiceRoadChange) settings.voiceRoadChange = voiceRoadChange.checked; else console.warn("voiceRoadChange element not found");
    if (showHromady) settings.showHromady = showHromady.checked; else console.warn("showHromady element not found");
    if (showInternationalRoads) settings.showInternationalRoads = showInternationalRoads.checked; else console.warn("showInternationalRoads element not found");
    if (showNationalRoads) settings.showNationalRoads = showNationalRoads.checked; else console.warn("showNationalRoads element not found");
    if (showRegionalRoads) settings.showRegionalRoads = showRegionalRoads.checked; else console.warn("showRegionalRoads element not found");
    if (showTerritorialRoads) settings.showTerritorialRoads = showTerritorialRoads.checked; else console.warn("showTerritorialRoads element not found");
    if (showSpeedCameras) settings.showSpeedCameras = showSpeedCameras.checked; else console.warn("showSpeedCameras element not found");
    if (langSelect) setLanguage(langSelect.value); else console.warn("languageSelect element not found");

    // Перезапускаємо інтервал збереження якщо тест активний
    if (testActive && dataInterval) {
        clearInterval(dataInterval);
        dataInterval = setInterval(
            saveDataPoint,
            settings.saveInterval * 1000
        );
    }

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

    if (typeof updateHromadyLayer === 'function') {
        updateHromadyLayer();
    }
    if (typeof updateRoadLayers === 'function') {
        updateRoadLayers();
    }

    showNotification(t('settingsSaved', 'Налаштування збережено!'));
    toggleSettings();
}

function loadSettings() {
    const panel = document.getElementById("settingsPanel");
    if (!panel) {
        console.warn("settingsPanel element not found");
        return;
    }

    const soundAlerts = panel.querySelector("#soundAlerts");
    const voiceAlerts = panel.querySelector("#voiceAlerts");
    const voiceHromadaChange = panel.querySelector("#voiceHromadaChange");
    const voiceRoadChange = panel.querySelector("#voiceRoadChange");
    const showHromady = panel.querySelector("#showHromady");
    const showInternationalRoads = panel.querySelector("#showInternationalRoads");
    const showNationalRoads = panel.querySelector("#showNationalRoads");
    const showRegionalRoads = panel.querySelector("#showRegionalRoads");
    const showTerritorialRoads = panel.querySelector("#showTerritorialRoads");
    const showSpeedCameras = panel.querySelector("#showSpeedCameras");
    const langSelect = panel.querySelector("#languageSelect");

    if (soundAlerts) soundAlerts.checked = settings.soundAlerts; else console.warn("soundAlerts element not found");
    if (voiceAlerts) voiceAlerts.checked = settings.voiceAlerts; else console.warn("voiceAlerts element not found");
    if (voiceHromadaChange) voiceHromadaChange.checked = settings.voiceHromadaChange; else console.warn("voiceHromadaChange element not found");
    if (voiceRoadChange) voiceRoadChange.checked = settings.voiceRoadChange; else console.warn("voiceRoadChange element not found");
    if (showHromady) showHromady.checked = settings.showHromady; else console.warn("showHromady element not found");
    if (showInternationalRoads) showInternationalRoads.checked = settings.showInternationalRoads; else console.warn("showInternationalRoads element not found");
    if (showNationalRoads) showNationalRoads.checked = settings.showNationalRoads; else console.warn("showNationalRoads element not found");
    if (showRegionalRoads) showRegionalRoads.checked = settings.showRegionalRoads; else console.warn("showRegionalRoads element not found");
    if (showTerritorialRoads) showTerritorialRoads.checked = settings.showTerritorialRoads; else console.warn("showTerritorialRoads element not found");
    if (showSpeedCameras) showSpeedCameras.checked = settings.showSpeedCameras; else console.warn("showSpeedCameras element not found");
    if (langSelect) langSelect.value = currentLang; else console.warn("languageSelect element not found");
}
