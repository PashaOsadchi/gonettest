import { showNotification, playBeep, speak } from "./audio.js";
import { initMap, initMapIfNeeded, setupMapObserver, addMapMarker, calculateDistance } from "./map.js";
import { downloadData, downloadKML, downloadHTML, exportChart } from "./export.js";

// Конфігурація
const TARGET = 100 * 1024 * 1024; // * 1024; // Обсяг для тестового завантаження (байт)
const MAX_CONSECUTIVE_ERRORS = 1000; // Максимальна кількість помилок поспіль
const RECONNECT_TIMEOUT = 1000; // Таймаут перевірки підключення (мс)
const BIG_FETCH_TIMEOUT = 30000; // Таймаут великого запиту (мс, 30 с)
const GPS_TIMEOUT = 5000; // Таймаут GPS (мс)
const GPS_MAX_AGE = 1000; // Максимальний вік GPS-даних (мс)
const MAX_GPS_ACCURACY = 5; // meters
const DEFAULT_FETCH_TIMEOUT = 1000; // Таймаут запиту за замовчуванням (мс)
const STREAM_READ_TIMEOUT = 500000; // Таймаут читання потоку (мс, 5 с)
const UI_UPDATE_INTERVAL = 1000; // Інтервал оновлення UI (мс)
const DEFAULT_SAVE_INTERVAL = 1; // Інтервал збереження даних (с)
const RECONNECT_RETRY_INTERVAL = 500; // Інтервал спроб підключення (мс)
const RUN_LOOP_PAUSE = 500; // Пауза в циклі тесту (мс)
const ORIENTATION_DELAY = 100; // Затримка після зміни орієнтації (мс)
const MAX_DATA_POINTS = 60; // Максимальна кількість точок графіка
const serverUrl = `https://speed.cloudflare.com/__down?bytes=${TARGET}`;
const STORAGE_KEY = 'speedData';


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
    updateGPSInfo();
    updateRecordsCount();
}

function initLanguage() {
    setLanguage(currentLang);
}

const DEFAULT_DIRECTION_LABELS = {
    uk: ["Пн", "ПнСх", "Сх", "ПдСх", "Пд", "ПдЗх", "Зх", "ПнЗх"],
    en: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
};

// Wake Lock
let wakeLock = null;

async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => {
            wakeLock = null;
            console.log('Wake Lock released');
        });
    } catch (err) {
        console.error('Wake Lock error:', err);
    }
}

document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});

// Глобальні змінні
let testActive = false;
let totalBytes = 0,
    prevBytes = 0,
    startTime = 0,
    updateInterval = null;
let consecutiveErrors = 0;
let isConnected = true;
let isFullscreen = false;
let testInProgress = false;
let pendingRun = false;
let activeDownloadController = null;
let isDownloading = false;

// Дані та налаштування
let speedData = [];
let dataInterval = null;
let lastSavedBytes = 0;
let currentSpeedMbps = 0;
let currentGPSData = {
    latitude: null,
    longitude: null,
    altitude: null,
    speed: null,
    accuracy: null,
    heading: null,
};
let lastSavedGPSData = {
    latitude: null,
    longitude: null,
};
let gpsWatchId = null;
let totalDistance = 0;

// Налаштування
let settings = {
    saveInterval: DEFAULT_SAVE_INTERVAL,
    gpsDistance: 10,
    speedThreshold: 5,
    soundAlerts: true,
    voiceAlerts: false,
};

window.settings = settings;
// Графік
let speedChart = null;
let chartData = [];
let maxDataPoints = MAX_DATA_POINTS; // Показуємо останні 60 точок

// Карта
let map = null;
let mapMarkers = [];
let mapInitialized = false;

// Статистика
let speedStats = {
    min: Infinity,
    max: 0,
    sum: 0,
    count: 0,
};

let operator = ''

let ipinfo = {
    "ip": "", // "8.8.8.8",
    "hostname": "", // "dns.google",
    "city": "", // "Mountain View",
    "region": "", // "California",
    "country": "", // "US",
    "loc": "", // "37.4056,-122.0775",
    "org": "", // "AS15169 Google LLC",
    "postal": "", // "94043",
    "timezone": "", // "America/Los_Angeles",
    "readme": "", // "https://ipinfo.io/missingauth"
}
 let operators = {
    'AS21497 PrJSC VF UKRAINE': 'Vodafone',
    'AS15895 "Kyivstar" PJSC': 'Kyivstar',
    'AS34058 Limited Liability Company "lifecell"': 'Lifecell'
 }

function saveSpeedDataToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(speedData));
}

function loadSpeedDataFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            speedData = JSON.parse(stored);
            chartData = speedData.slice(-maxDataPoints).map(d => ({ time: d.timestamp, speed: d.speed }));
        } catch (e) {
            speedData = [];
            chartData = [];
        }
    }
}

// Визначення провайдера
async function detectISP() {
    try {
        const res = await fetch('https://ipinfo.io/json?token=e2a0c701aef96b');
        const data = await res.json();

        // Визначаємо operator
        operator = operators[data.org] ?? data.org;   // якщо є ключ — беремо мапу, інакше data.org

        // Заповнюємо поля в DOM
        document.getElementById('ip').textContent       = data.ip       || '-';
        document.getElementById('hostname').textContent = data.hostname || '-';
        document.getElementById('city').textContent     = data.city     || '-';
        document.getElementById('region').textContent   = data.region   || '-';
        document.getElementById('country').textContent  = data.country  || '-';
        document.getElementById('loc').textContent      = data.loc      || '-';
        document.getElementById('org').textContent      = data.org      || '-';
        document.getElementById('postal').textContent   = data.postal   || '-';
        document.getElementById('timezone').textContent = data.timezone || '-';

        // Відображаємо знайдений оператор
        const operatorEl = document.getElementById('operator');
        operatorEl.textContent = operator || '-';
        operatorEl.classList.remove('operator-vodafone', 'operator-kyivstar', 'operator-lifecell');
        if (data.org === 'AS21497 PrJSC VF UKRAINE') {
            operatorEl.classList.add('operator-vodafone');
        } else if (data.org === 'AS15895 "Kyivstar" PJSC') {
            operatorEl.classList.add('operator-kyivstar');
        } else if (data.org === 'AS34058 Limited Liability Company "lifecell"') {
            operatorEl.classList.add('operator-lifecell');
        }
    } catch (e) {
        document.getElementById('info').innerHTML =
            '<div class="error-message">Не вдалося отримати інформацію про з’єднання</div>';
        addLog('detectISP error: ' + e.message);
    }
}
detectISP();

// Звукові контексти
let audioContext = null;
let speechSynthesis = window.speechSynthesis;

function addLog(msg) {
    console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function formatSeconds(totalSeconds) {
    // Обчислюємо години, хвилини та секунди
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    // Створюємо масив для збереження частин часу
    const timeParts = [];
    
    // Додаємо години, якщо є
    if (hours > 0) {
        timeParts.push(`${hours}h`);
    }
    
    // Додаємо хвилини, якщо є
    if (minutes > 0) {
        timeParts.push(`${minutes}m`);
    }
    
    // Додаємо секунди, якщо є або якщо це єдина частина
    if (seconds > 0 || timeParts.length === 0) {
        timeParts.push(`${seconds}s`);
    }
    
    // З'єднуємо частини через пробіл
    return timeParts.join(' ');
}

function formatDownloaded(bytes) {
    const MB = 1024 * 1024;
    const GB = MB * 1024;
    if (bytes >= GB) {
        const gb = Math.floor(bytes / GB);
        const mb = Math.floor((bytes % GB) / MB);
        return `${gb} GB ${mb} MB`;
    } else {
        const mb = Math.floor(bytes / MB);
        return `${mb} MB`;
    }
}

    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.style.display = "block";
    setTimeout(() => {
        notification.style.display = "none";
    }, duration);
}

    if (!settings.soundAlerts) return;

    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext ||
                window.webkitAudioContext)();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + duration / 1000
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
        console.log("Помилка відтворення звуку:", e);
    }
}

function speak(text) {
    if (!settings.voiceAlerts || !speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "uk-UA";
    speechSynthesis.speak(utterance);
}

function logTestSummary() {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const downloadedFormatted = formatDownloaded(totalBytes);
    const avg = speedStats.count
        ? (speedStats.sum / speedStats.count).toFixed(2)
        : "0.00";
    const min = speedStats.min === Infinity ? 0 : speedStats.min;
    addLog(
        `Результати тесту: час ${elapsed} с, дані ${downloadedFormatted}, ` +
            `середня швидкість ${avg} Мбіт/с, ` +
            `макс ${speedStats.max.toFixed(2)} Мбіт/с, ` +
            `мін ${min === 0 ? "0.00" : min.toFixed(2)} Мбіт/с`
    );
}

function resetTestState() {
    testInProgress = false;
    pendingRun = false;
    isConnected = true;
    consecutiveErrors = 0;

    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    if (dataInterval) {
        clearInterval(dataInterval);
        dataInterval = null;
    }
}

function initChart() {
    const ctx = document.getElementById("speedChart").getContext("2d");
    speedChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: t('speedChartLabel', 'Графік швидкості завантаження Мбіт/с'),
                    data: [],
                    borderColor: "#4facfe",
                    backgroundColor: "rgba(79, 172, 254, 0.1)",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(
                            document.documentElement
                        ).getPropertyValue("--text-color"),
                    },
                },
            },
            scales: {
                x: {
                    ticks: {
                        color: getComputedStyle(
                            document.documentElement
                        ).getPropertyValue("--text-color"),
                        maxTicksLimit: 10,
                    },
                    grid: {
                        color: "rgba(255,255,255,0.1)",
                    },
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(
                            document.documentElement
                        ).getPropertyValue("--text-color"),
                    },
                    grid: {
                        color: "rgba(255,255,255,0.1)",
                    },
                },
            },
            animation: {
                duration: 300,
            },
        },
    });
}

function updateChart() {
    if (!speedChart) return;

    const now = new Date().toLocaleTimeString();

    chartData.push({
        time: now,
        speed: currentSpeedMbps,
    });

    // Обмежуємо кількість точок
    if (chartData.length > maxDataPoints) {
        chartData.shift();
    }

    speedChart.data.labels = chartData.map((d) => d.time);
    speedChart.data.datasets[0].data = chartData.map((d) => d.speed);
    speedChart.update("none");
}

function updateStats() {
    if (currentSpeedMbps > 0) {
        speedStats.min = Math.min(speedStats.min, currentSpeedMbps);
        speedStats.max = Math.max(speedStats.max, currentSpeedMbps);
        speedStats.sum += currentSpeedMbps;
        speedStats.count++;

        const avg = speedStats.sum / speedStats.count;

        document.getElementById("avgSpeed").textContent = `${avg.toFixed(
            2
        )}`;
        document.getElementById(
            "maxSpeed"
        ).textContent = `${speedStats.max.toFixed(2)}`;
        document.getElementById("minSpeed").textContent =
            speedStats.min === Infinity
                ? "0.00"
                : `${speedStats.min.toFixed(2)}`;

        // Перевірка порогу швидкості
        if (currentSpeedMbps < settings.speedThreshold && isConnected) {
            playBeep(400, 300);
            if (settings.voiceAlerts) {
                speak(
                    `Швидкість знизилась до ${currentSpeedMbps.toFixed(
                        1
                    )} мегабіт на секунду`
                );
            }
        }
    }
}

function updateSpeedPerSecond(speedMbps) {
    currentSpeedMbps = speedMbps;
    document.getElementById("speedValue").textContent = speedMbps.toFixed(2);
    updateChart();
    updateStats();
}

function getColorBySpeed(speed) {
    if (speed <= 0) return 'red';

function updateGPSInfo() {
    const gpsStatusEl = document.getElementById("gpsStatus");
    const currentCoordsEl = document.getElementById("currentCoords");
    const distanceInfoEl = document.getElementById("distanceInfo");
    const gpsAccuracyEl = document.getElementById("gpsAccuracy");
    const altitudeInfoEl = document.getElementById("altitudeInfo");
    const gpsSpeedInfoEl = document.getElementById("gpsSpeedInfo");
    const headingInfoEl = document.getElementById("headingInfo");
    const totalDistanceInfoEl =
        document.getElementById("totalDistanceInfo");

    const naText = t('naValue', 'N/A');
    const unitM = t('unitMeters', 'м');
    const directions = t('directionLabels', DEFAULT_DIRECTION_LABELS[currentLang]);

    if (currentGPSData.latitude && currentGPSData.longitude) {
        gpsStatusEl.textContent = t('gpsActive', 'Активний');
        gpsStatusEl.classList.remove('status-warning', 'status-success', 'status-accent');
        gpsStatusEl.classList.add('status-accent');
        currentCoordsEl.textContent = `${currentGPSData.latitude.toFixed(
            6
        )}, ${currentGPSData.longitude.toFixed(6)}`;

        // Точність
        if (currentGPSData.accuracy) {
            gpsAccuracyEl.textContent = `±${currentGPSData.accuracy.toFixed(
                1
            )}`;
            gpsAccuracyEl.classList.remove('status-warning', 'status-success', 'status-accent');
            if (currentGPSData.accuracy < 10) {
                gpsAccuracyEl.classList.add('status-accent');
            } else if (currentGPSData.accuracy < 50) {
                gpsAccuracyEl.classList.add('status-success');
            } else {
                gpsAccuracyEl.classList.add('status-warning');
            }
        } else {
            gpsAccuracyEl.textContent = naText;
        }

        // Висота
        if (currentGPSData.altitude !== null) {
            altitudeInfoEl.textContent = `${currentGPSData.altitude.toFixed(
                1
            )}`;
        } else {
            altitudeInfoEl.textContent = naText;
        }

        // GPS швидкість
        if (currentGPSData.speed !== null && currentGPSData.speed > 0) {
            gpsSpeedInfoEl.textContent = `${(
                currentGPSData.speed * 3.6
            ).toFixed(1)}`;
        } else {
            gpsSpeedInfoEl.textContent = naText;
        }

        // Напрямок
        if (currentGPSData.heading !== null) {
            const directionIndex =
                Math.round(currentGPSData.heading / 45) % directions.length;
            headingInfoEl.textContent = `${currentGPSData.heading.toFixed(
                0
            )}° (${directions[directionIndex]})`;
        } else {
            headingInfoEl.textContent = naText;
        }

        // Відстань від попередньої точки
        if (lastSavedGPSData.latitude && lastSavedGPSData.longitude) {
            const distance = calculateDistance(
                lastSavedGPSData.latitude,
                lastSavedGPSData.longitude,
                currentGPSData.latitude,
                currentGPSData.longitude
            );
            distanceInfoEl.textContent = `${distance.toFixed(1)}`;

            distanceInfoEl.classList.remove('status-warning', 'status-success', 'status-accent');
            if (distance > settings.gpsDistance) {
                distanceInfoEl.classList.add('status-accent');
            } else {
                distanceInfoEl.classList.add('status-warning');
            }
        } else {
            distanceInfoEl.textContent = t('firstPoint', 'Перша точка');
            distanceInfoEl.classList.remove('status-warning', 'status-accent');
            distanceInfoEl.classList.add('status-success');
        }

        // Загальна відстань
        totalDistanceInfoEl.textContent = `${(totalDistance / 1000).toFixed(
            2
        )}`;
    } else {
        gpsStatusEl.textContent = t('gpsWaiting', 'Очікування сигналу');
        gpsStatusEl.classList.remove('status-accent', 'status-success', 'status-warning');
        gpsStatusEl.classList.add('status-warning');
        currentCoordsEl.textContent = naText;
        distanceInfoEl.textContent = naText;
        gpsAccuracyEl.textContent = naText;
        altitudeInfoEl.textContent = naText;
        gpsSpeedInfoEl.textContent = naText;
        headingInfoEl.textContent = naText;
    }
}

function initGPS() {
    if (!navigator.geolocation) {
        addLog("GPS не підтримується браузером");
        document.getElementById("gpsStatus").textContent = t('gpsNotSupported', 'Не підтримується');
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: GPS_TIMEOUT,
        maximumAge: GPS_MAX_AGE,
    };

    gpsWatchId = navigator.geolocation.watchPosition(
        (position) => {
            currentGPSData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                altitude: position.coords.altitude,
                speed: position.coords.speed,
                accuracy: position.coords.accuracy,
                heading: position.coords.heading,
            };
            updateGPSInfo();
            addLog(
                `GPS оновлено: ${currentGPSData.latitude.toFixed(
                    6
                )}, ${currentGPSData.longitude.toFixed(6)}`
            );
        },
        (error) => {
            addLog(`GPS помилка: ${error.message}`);
            const statusEl = document.getElementById("gpsStatus");
            statusEl.textContent = t('gpsError', 'Помилка GPS');
            statusEl.classList.remove('status-accent', 'status-success', 'status-warning');
            statusEl.classList.add('status-warning');
        },
        options
    );
}

function stopGPS() {
    if (gpsWatchId) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
        const statusEl = document.getElementById("gpsStatus");
        statusEl.textContent = t('gpsInactive', 'Не активний');
        statusEl.classList.remove('status-accent', 'status-success', 'status-warning');
        addLog("GPS зупинено");
    }
}

function shouldSaveDataPoint() {
    if (!currentGPSData.latitude || !currentGPSData.longitude) {
        return false;
    }

    if (
        currentGPSData.accuracy !== null &&
        currentGPSData.accuracy > MAX_GPS_ACCURACY
    ) {
        addLog(
            `GPS accuracy ${currentGPSData.accuracy} > ${MAX_GPS_ACCURACY}, skipping`
        );
        return false;
    }

    if (!lastSavedGPSData.latitude || !lastSavedGPSData.longitude) {
        return true;
    }

    const distance = calculateDistance(
        lastSavedGPSData.latitude,
        lastSavedGPSData.longitude,
        currentGPSData.latitude,
        currentGPSData.longitude
    );

    return distance > settings.gpsDistance;
}

function saveDataPoint() {
    if (!testActive) return;

    if (!shouldSaveDataPoint()) {
        return;
    }

    const now = new Date();
    const elapsed = (Date.now() - startTime) / 1000;

    // Обчислюємо відстань для додавання до загальної
    if (lastSavedGPSData.latitude && lastSavedGPSData.longitude) {
        const distance = calculateDistance(
            lastSavedGPSData.latitude,
            lastSavedGPSData.longitude,
            currentGPSData.latitude,
            currentGPSData.longitude
        );
        totalDistance += distance;
    }

    const dataPoint = {
        timestamp: now.toLocaleTimeString(),
        fullTimestamp: now,
        speed: currentSpeedMbps,
        downloaded: totalBytes / (1024 * 1024),
        elapsed: Math.floor(elapsed),
        latitude: currentGPSData.latitude,
        longitude: currentGPSData.longitude,
        altitude: currentGPSData.altitude,
        gpsSpeed: currentGPSData.speed ? currentGPSData.speed * 3.6 : null,
        accuracy: currentGPSData.accuracy,
        heading: currentGPSData.heading,
    };

    speedData.push(dataPoint);
    saveSpeedDataToStorage();
    addMapMarker(dataPoint);

    lastSavedGPSData = {
        latitude: currentGPSData.latitude,
        longitude: currentGPSData.longitude,
    };

    const lastSaveEl = document.getElementById("lastSaveInfo");
    lastSaveEl.textContent = now.toLocaleTimeString();
    lastSaveEl.removeAttribute('data-i18n');
    lastSaveEl.classList.remove('status-warning', 'status-success', 'status-accent');
    lastSaveEl.classList.add('status-accent');

    updateDataDisplay();
    updateRecordsCount();
    updateGPSInfo();

    addLog(
        `Дані збережено: ${currentGPSData.latitude.toFixed(
            6
        )}, ${currentGPSData.longitude.toFixed(6)}`
    );
}

function updateDataDisplay() {
    const dataDisplay = document.getElementById("dataDisplay");
    const lastRecords = speedData.slice(-10).reverse();

    if (lastRecords.length === 0) {
        dataDisplay.innerHTML =
            `<div class="placeholder">${t('noData', 'Немає даних')}</div>`;
        return;
    }

    dataDisplay.innerHTML = lastRecords
        .map(
            (record) => `
                <div class="data-row">
                    <div>${record.timestamp}</div>
                    <div>${record.speed.toFixed(2)}</div>
                    <div>${record.latitude ? record.latitude.toFixed(6) : "N/A"
                }</div>
                    <div>${record.longitude ? record.longitude.toFixed(6) : "N/A"
                }</div>
                    <div>${record.altitude ? record.altitude.toFixed(1) : "N/A"
                }</div>
                    <div>${record.gpsSpeed
                    ? record.gpsSpeed.toFixed(1) : "N/A"
                }</div>
                </div>
            `
        )
        .join("");
}

function updateRecordsCount() {
    document.getElementById("recordsCount").textContent = speedData.length;
    const label = (window.i18n && window.i18n[currentLang] && window.i18n[currentLang].recordsCount) || 'Записів:';
    document.getElementById("recordsInfo").textContent = `${label} ${speedData.length}`;
}


function clearData() {
    if (speedData.length === 0) return;

    if (confirm("Ви впевнені, що хочете очистити всі дані?")) {
        speedData = [];
        saveSpeedDataToStorage();
        chartData = [];
        lastSavedGPSData = { latitude: null, longitude: null };
        totalDistance = 0;
        speedStats = { min: Infinity, max: 0, sum: 0, count: 0 };

        if (speedChart) {
            speedChart.data.labels = [];
            speedChart.data.datasets[0].data = [];
            speedChart.update();
        }

        updateDataDisplay();
        updateRecordsCount();
        updateGPSInfo();

        const lastSaveEl = document.getElementById("lastSaveInfo");
        lastSaveEl.textContent = t('noData', 'Немає даних');
        lastSaveEl.setAttribute('data-i18n', 'noData');
        lastSaveEl.classList.remove('status-accent', 'status-success', 'status-warning');
        document.getElementById("avgSpeed").textContent = "0.00";
        document.getElementById("maxSpeed").textContent = "0.00";
        document.getElementById("minSpeed").textContent = "0.00 ";
        document.getElementById("totalDistanceInfo").textContent = "0.00";

        showNotification(t('dataCleared', 'Дані очищено!'));
    }
}

function updateUI() {
    const now = Date.now();
    const elapsed = (now - startTime) / 1000;
    const delta = totalBytes - prevBytes;
    prevBytes = totalBytes;
    const speedMbps = (delta * 8) / (1024 * 1024);

    currentSpeedMbps = speedMbps;

    if (isConnected) {
        document.getElementById("speedValue").textContent =
            speedMbps.toFixed(2);
        document.getElementById("status").textContent = t('statusActive', 'Тест активний');

        // Ховаємо індикатор помилки
        document.getElementById("alertIndicator").style.display = "none";
    }

    document.getElementById("downloadedValue").textContent = formatDownloaded(totalBytes);
    document.getElementById("timeValue").textContent = formatSeconds(Math.floor(elapsed));

    updateGPSInfo();
    updateChart();
    updateStats();
}

async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_FETCH_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

async function checkRealConnection() {
    try {
        await fetchWithTimeout(
            'https://www.google.com/generate_204',
            { cache: 'no-store', mode: 'no-cors' },
            RECONNECT_TIMEOUT
        );
        return true;
    } catch (e) {
        addLog('checkRealConnection error: ' + e.message);
        return false;
    }
}

async function measureDownloadSpeed() {
    activeDownloadController = new AbortController();
    const timeoutId = setTimeout(() => activeDownloadController.abort(), BIG_FETCH_TIMEOUT);
    try {
        const resp = await fetch(serverUrl, { signal: activeDownloadController.signal });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const reader = resp.body.getReader();
        let bytes = 0;
        const start = performance.now();
        let lastUpdate = start;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!testActive) {
            activeDownloadController.abort();
            throw new DOMException('Aborted', 'AbortError');
        }
        bytes += value.length;
        totalBytes += value.length;

        const now = performance.now();
        if (now - lastUpdate >= 1000) {
            const speed = (bytes * 8) / ((now - start) / 1000) / (1024 * 1024);
            updateSpeedPerSecond(speed);
            lastUpdate = now;
        }

        if (bytes >= TARGET) {
            try { await reader.cancel(); } catch (e) {}
            break;
        }
    }

        const duration = (performance.now() - start) / 1000;
        const speedMbps = (bytes * 8) / (duration * 1024 * 1024);
        updateSpeedPerSecond(speedMbps);
        return { speedMbps, bytes };
    } finally {
        clearTimeout(timeoutId);
        activeDownloadController = null;
    }
}

async function runTest() {
  if (!testActive) {
    resetTestState();
    return;
  }

  if (testInProgress) {
    pendingRun = true;
    return;
  }
  testInProgress = true;
  pendingRun = false;
  startTime = Date.now();
  prevBytes = totalBytes = 0;
  consecutiveErrors = 0;
  // Запускаємо оновлення UI що секунду
  updateInterval = setInterval(updateUI, UI_UPDATE_INTERVAL);
  // Запускаємо періодичне збереження точок даних
  dataInterval = setInterval(saveDataPoint, settings.saveInterval * 1000);

  while (testActive) {
    if (!testActive) break;
    try {
      addLog("Спроба завантаження…");
      if (!isConnected) {
        await waitForReconnect();
        if (!testActive) break;
      }

      const { speedMbps } = await measureDownloadSpeed();
      consecutiveErrors = 0;
      currentSpeedMbps = speedMbps;
      updateStats();
    } catch (e) {
      if (e.name === 'AbortError' && !testActive) {
        break;
      }
      if (e.message && e.message.includes('ERR_NETWORK_CHANGED')) {
        addLog('Network interface changed, retrying…');
        continue;
      }
      isConnected = false;
      consecutiveErrors++;
      document.getElementById("speedValue").textContent = "0.00";
      document.getElementById("status").textContent = t('statusNoConnection', 'Відсутнє з\'єднання');
      document.getElementById("alertIndicator").style.display = "block";

      const errorMsg = e.name === "AbortError" ? "Timeout" : e.message;
      const elapsedErr = ((Date.now() - startTime) / 1000).toFixed(1);
      const downloadedErr = formatDownloaded(totalBytes);
      addLog(
        `Помилка з'єднання: ${errorMsg}; передано ${downloadedErr} за ${elapsedErr} с ` +
        `(${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})`
      );
      playBeep(300, 500);
      if (consecutiveErrors === 1) {
        showNotification(t('alertConnectionLost', "Втрачено з'єднання!"));
        speak("Втрачено з'єднання з інтернетом");
      }

      await waitForReconnect();
      if (!testActive) break;
      continue;
    }

    if (testActive && isConnected) {
      await new Promise((r) => setTimeout(r, RUN_LOOP_PAUSE));
    }
  }

  // Коли юзер натисне «Стоп», виходимо із зовнішнього циклу:
  clearInterval(updateInterval);
  clearInterval(dataInterval);
  document.getElementById("status").textContent = t('statusStopped', 'Тест зупинено');
  document.getElementById("alertIndicator").style.display = "none";
  testInProgress = false;
  if (pendingRun && testActive) {
    pendingRun = false;
    runTest();
    return;
  }
  stopGPS();
  resetTestState();
  logTestSummary();
}

// Окрема допоміжна функція, яка повертається лише тоді, коли перевірка
// (fetch із bytes=1) проходить успішно — тобто мережа з’явилася.
async function waitForReconnect() {
  // Використовуємо мінімальний 1-байтовий запит для перевірки доступності
  const checkUrl1 = `https://www.google.com/generate_204`;
  const checkUrl2 = `https://www.google.com/generate_204`;

  // Поки тест активний і мережі немає — пробуємо кожні 500 мс відправити маленький запит
  while (testActive && !isConnected) {
    if (!testActive) return;
    let success = false;
    addLog("Перевірка з'єднання…");

    try {
      await fetchWithTimeout(
        checkUrl1,
        { cache: "no-store", mode: "no-cors" },
        RECONNECT_TIMEOUT
      );
      success = true;
    } catch (e) {
      addLog('waitForReconnect checkUrl1 error: ' + e.message);
    }

    if (!success) {
      try {
        await fetchWithTimeout(
          checkUrl2,
          { cache: "no-store", mode: "no-cors" },
          RECONNECT_TIMEOUT
        );
        success = true;
      } catch (e) {
        addLog('waitForReconnect checkUrl2 error: ' + e.message);
      }
    }

    if (success) {
      // Навіть без CORS, якщо запит завершився успішно — мережа присутня
      isConnected = true;
      break;
    }

    await new Promise((r) => setTimeout(r, RECONNECT_RETRY_INTERVAL));
  }
}

async function toggleTest() {
    if (testInProgress && testActive) {
        testActive = false;
        if (activeDownloadController) {
            activeDownloadController.abort();
        }
        document.getElementById("startBtn").textContent = t('startTest', 'Почати тест');
        addLog("Зупинка тесту...");
        showNotification(t('testStopped', 'Тест зупинено!'));
        return;
    }

    if (!testInProgress) {
        testActive = true;
        document.getElementById("startBtn").textContent = t('stopTest', 'Зупинити тест');
        addLog("Старт тесту");
        showNotification(t('testStarted', 'Тест запущено!'));
        initMapIfNeeded();

        isConnected = await checkRealConnection();
        initGPS();
        runTest();
    }
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", newTheme);
    localStorage.setItem('theme', newTheme);

    // Update theme color meta tag
    const themeColorMeta = document.getElementById('themeColorMeta');
    if (themeColorMeta) {
        themeColorMeta.content = newTheme === 'dark' ? '#1a1a2e' : '#667eea';
    }

    // Оновлюємо графік під нову тему
    if (speedChart) {
        const textColor = getComputedStyle(
            document.documentElement
        ).getPropertyValue("--text-color");
        speedChart.options.plugins.legend.labels.color = textColor;
        speedChart.options.scales.x.ticks.color = textColor;
        speedChart.options.scales.y.ticks.color = textColor;
        speedChart.update();
    }

    showNotification(
        newTheme === 'dark'
            ? t('themeSwitchedDark', 'Переключено на темну тему')
            : t('themeSwitchedLight', 'Переключено на світлу тему')
    );
}

function loadTheme() {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
        document.body.setAttribute('data-theme', storedTheme);
        const themeColorMeta = document.getElementById('themeColorMeta');
        if (themeColorMeta) {
            themeColorMeta.content =
                storedTheme === 'dark' ? '#1a1a2e' : '#667eea';
        }
    }
}

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

function toggleSettings() {
    const panel = document.getElementById("settingsPanel");
    panel.classList.toggle("active");
}

function refreshPage() {
    window.location.reload();
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

    window.settings = settings;
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

// Ініціалізація після побудови DOM
window.addEventListener("DOMContentLoaded", () => {
    initLanguage();
    loadTheme();
    loadSpeedDataFromStorage();
    initChart();
    loadSettings();
    updateGPSInfo();
    requestWakeLock();
    setupMapObserver();
    updateDataDisplay();
    updateRecordsCount();

    // Обробка виходу з повноекранного режиму
    document.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement && isFullscreen) {
            toggleFullscreen();
        }
    });
});

// Обробка зміни орієнтації для мобільних
window.addEventListener("orientationchange", () => {
    setTimeout(() => {
        if (speedChart) {
            speedChart.resize();
        }
    }, ORIENTATION_DELAY);
});


// Expose functions for inline event handlers
window.downloadData = () => downloadData(speedData, operator);
window.downloadKML = () => downloadKML(speedData, operator);
window.downloadHTML = () => downloadHTML(speedData, operator);
window.exportChart = () => exportChart(speedChart);
window.toggleTest = toggleTest;
window.toggleTheme = toggleTheme;
window.toggleFullscreen = toggleFullscreen;
window.toggleSettings = toggleSettings;
window.refreshPage = refreshPage;
window.saveSettings = saveSettings;
window.clearData = clearData;
window.showNotification = showNotification;
window.playBeep = playBeep;
window.speak = speak;

