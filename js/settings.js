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
    settings.soundAlerts = document.getElementById("soundAlerts").checked;
    settings.voiceAlerts = document.getElementById("voiceAlerts").checked;
    settings.voiceHromadaChange = document.getElementById("voiceHromadaChange").checked;
    settings.voiceRoadChange = document.getElementById("voiceRoadChange").checked;
    settings.showHromady = document.getElementById("showHromady").checked;
    settings.showInternationalRoads = document.getElementById("showInternationalRoads").checked;
    settings.showNationalRoads = document.getElementById("showNationalRoads").checked;
    settings.showRegionalRoads = document.getElementById("showRegionalRoads").checked;
    settings.showTerritorialRoads = document.getElementById("showTerritorialRoads").checked;
    const langSelect = document.getElementById("languageSelect");
    if (langSelect) setLanguage(langSelect.value);

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
    document.getElementById("soundAlerts").checked = settings.soundAlerts;
    document.getElementById("voiceAlerts").checked = settings.voiceAlerts;
    document.getElementById("voiceHromadaChange").checked = settings.voiceHromadaChange;
    document.getElementById("voiceRoadChange").checked = settings.voiceRoadChange;
    document.getElementById("showHromady").checked = settings.showHromady;
    document.getElementById("showInternationalRoads").checked = settings.showInternationalRoads;
    document.getElementById("showNationalRoads").checked = settings.showNationalRoads;
    document.getElementById("showRegionalRoads").checked = settings.showRegionalRoads;
    document.getElementById("showTerritorialRoads").checked = settings.showTerritorialRoads;
    const langSelect = document.getElementById("languageSelect");
    if (langSelect) langSelect.value = currentLang;
}
