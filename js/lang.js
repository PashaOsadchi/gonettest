import { currentLang as initialLang, speedChart } from './config.js';
import { updateGPSInfo } from './update_GPS_info.js';
import { updateDatabaseInfo } from './update_database_info.js';

let currentLang = initialLang;

function t(key, fallback = '') {
    const dict = window.i18n && window.i18n[currentLang];
    return (dict && dict[key]) || fallback;
}

function applyTranslations() {
    const dict = window.i18n && window.i18n[currentLang];
    if (!dict) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        if (dict[key]) {
            el.setAttribute('aria-label', dict[key]);
        }
    });
    document.documentElement.lang = currentLang;
    if (dict.appTitle) {
        document.title = dict.appTitle;
    }
    const logo = document.querySelector('img.logo');
    if (logo && dict.logoAlt) {
        logo.alt = dict.logoAlt;
    }
}

function setLanguage(lang) {
    currentLang = lang;
    window.currentLang = lang;
    localStorage.setItem('lang', lang);
    applyTranslations();
    const select = document.getElementById('languageSelect');
    if (select) select.value = lang;
    if (speedChart && window.i18n && window.i18n[currentLang]) {
        speedChart.data.datasets[0].label =
            window.i18n[currentLang].speedChartLabel ||
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
    setLanguage(currentLang);
}