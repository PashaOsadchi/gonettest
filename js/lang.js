function t(key, fallback = '') {
    const dict = window.i18n && window.i18n[window.currentLang];
    return (dict && key in dict) ? dict[key] : fallback;
}

function applyTranslations() {
    const dict = window.i18n && window.i18n[window.currentLang];
    if (!dict) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key in dict) {
            el.textContent = dict[key];
        }
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        if (key in dict) {
            el.setAttribute('aria-label', dict[key]);
        }
    });
    document.documentElement.lang = window.currentLang;
    if ('appTitle' in dict) {
        document.title = dict.appTitle;
    }
    const logo = document.querySelector('img.logo');
    if (logo && 'logoAlt' in dict) {
        logo.alt = dict.logoAlt;
    }
}

function setLanguage(lang) {
    window.currentLang = lang;
    localStorage.setItem('lang', lang);
    applyTranslations();
    const select = document.getElementById('languageSelect');
    if (select) select.value = lang;
    if (speedChart?.data?.datasets?.[0] && window.i18n?.[window.currentLang]) {
        speedChart.data.datasets[0].label =
            window.i18n[window.currentLang].speedChartLabel ||
            speedChart.data.datasets[0].label;
        speedChart.update();
    }
    if (typeof updateGPSInfo === "function") {
        updateGPSInfo();
    }
    if (typeof updateDatabaseInfo === "function") {
        updateDatabaseInfo();
    }
}

function initLanguage() {
    if (typeof window.currentLang !== 'undefined') {
        setLanguage(window.currentLang);
    }
}

window.initLanguage = initLanguage;
