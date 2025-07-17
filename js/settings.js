function toggleSettings() {
    const panel = document.getElementById("settingsPanel");
    panel.classList.toggle("active");
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

function clampNumber(value, min, max, def) {
    const num = parseFloat(value);
    if (isNaN(num)) return { value: def, error: true };
    if (num < min) return { value: min, error: true };
    if (num > max) return { value: max, error: true };
    return { value: num, error: false };
}

function saveSettings() {
    let hasError = false;
    let result = clampNumber(
        document.getElementById("saveInterval").value,
        1,
        60,
        DEFAULT_SAVE_INTERVAL
    );
    settings.saveInterval = result.value;
    document.getElementById("saveInterval").value = settings.saveInterval;
    hasError = hasError || result.error;

    result = clampNumber(
        document.getElementById("gpsDistance").value,
        0,
        100,
        10
    );
    settings.gpsDistance = result.value;
    document.getElementById("gpsDistance").value = settings.gpsDistance;
    hasError = hasError || result.error;

    result = clampNumber(
        document.getElementById("speedThreshold").value,
        0,
        1000,
        5
    );
    settings.speedThreshold = result.value;
    document.getElementById("speedThreshold").value = settings.speedThreshold;
    hasError = hasError || result.error;
    settings.soundAlerts = document.getElementById("soundAlerts").checked;
    settings.voiceAlerts = document.getElementById("voiceAlerts").checked;
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

    if (hasError) {
        showNotification(t('settingsInvalid', 'Некоректні значення!'));
    } else {
        showNotification(t('settingsSaved', 'Налаштування збережено!'));
    }
    toggleSettings();
}

function loadSettings() {
    document.getElementById("saveInterval").value = settings.saveInterval;
    document.getElementById("gpsDistance").value = settings.gpsDistance;
    document.getElementById("speedThreshold").value =
        settings.speedThreshold;
    document.getElementById("soundAlerts").checked = settings.soundAlerts;
    document.getElementById("voiceAlerts").checked = settings.voiceAlerts;
    document.getElementById("showHromady").checked = settings.showHromady;
    document.getElementById("showInternationalRoads").checked = settings.showInternationalRoads;
    document.getElementById("showNationalRoads").checked = settings.showNationalRoads;
    document.getElementById("showRegionalRoads").checked = settings.showRegionalRoads;
    document.getElementById("showTerritorialRoads").checked = settings.showTerritorialRoads;
    const langSelect = document.getElementById("languageSelect");
    if (langSelect) langSelect.value = currentLang;
}