function toggleSettings() {
    const panel = document.getElementById("settingsPanel");
    panel.classList.toggle("active");
}

function saveSettings() {
    settings.saveInterval =
        parseInt(document.getElementById("saveInterval").value) || 1;
    settings.gpsDistance =
        parseFloat(document.getElementById("gpsDistance").value) || 1;
    settings.speedThreshold =
        parseFloat(document.getElementById("speedThreshold").value) || 5;
    settings.soundAlerts = document.getElementById("soundAlerts").checked;
    settings.voiceAlerts = document.getElementById("voiceAlerts").checked;
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

    showNotification(t('settingsSaved', 'Налаштування збережено!'));
    toggleSettings();
}

function loadSettings() {
    document.getElementById("saveInterval").value = settings.saveInterval;
    document.getElementById("gpsDistance").value = settings.gpsDistance;
    document.getElementById("speedThreshold").value =
        settings.speedThreshold;
    document.getElementById("soundAlerts").checked = settings.soundAlerts;
    document.getElementById("voiceAlerts").checked = settings.voiceAlerts;
    const langSelect = document.getElementById("languageSelect");
    if (langSelect) langSelect.value = currentLang;
}