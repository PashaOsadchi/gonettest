// Конфігурація
const TARGET = 100 * 1024 * 1024; // * 1024; // Обсяг для тестового завантаження (байт)
const MAX_CONSECUTIVE_ERRORS = 1000; // Максимальна кількість помилок поспіль
const RECONNECT_TIMEOUT = 1000; // Таймаут перевірки підключення (мс)
const BIG_FETCH_TIMEOUT = 30000; // Таймаут великого запиту (мс, 30 с)
const NOTIFICATION_DURATION = 3000; // Тривалість сповіщення (мс)
const BEEP_FREQUENCY = 800; // Частота сигналу за замовчуванням (Гц)
const BEEP_DURATION = 200; // Тривалість сигналу за замовчуванням (мс)
const SPEECH_RATE = 0.8; // Швидкість синтезу мовлення
const GPS_TIMEOUT = 5000; // Таймаут GPS (мс)
const GPS_MAX_AGE = 1000; // Максимальний вік GPS-даних (мс)
const DEFAULT_FETCH_TIMEOUT = 1000; // Таймаут запиту за замовчуванням (мс)
const STREAM_READ_TIMEOUT = 500000; // Таймаут читання потоку (мс, 5 с)
const UI_UPDATE_INTERVAL = 1000; // Інтервал оновлення UI (мс)
const DEFAULT_SAVE_INTERVAL = 1; // Інтервал збереження даних (с)
const RECONNECT_RETRY_INTERVAL = 500; // Інтервал спроб підключення (мс)
const RUN_LOOP_PAUSE = 500; // Пауза в циклі тесту (мс)
const ORIENTATION_DELAY = 100; // Затримка після зміни орієнтації (мс)
const MAX_DATA_POINTS = 60; // Максимальна кількість точок графіка

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
    gpsDistance: 1,
    speedThreshold: 1,
    soundAlerts: true,
    voiceAlerts: false,
};

// Графік
let speedChart = null;
let chartData = [];
let maxDataPoints = MAX_DATA_POINTS; // Показуємо останні 60 точок

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
        document.getElementById('operator').textContent = operator || '-';
    } catch (e) {
        document.getElementById('info').innerHTML =
            '<div style="color:red;">Не вдалося отримати інформацію про з’єднання</div>';
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

function showNotification(message, duration = NOTIFICATION_DURATION) {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.style.display = "block";
    setTimeout(() => {
        notification.style.display = "none";
    }, duration);
}

function playBeep(frequency = BEEP_FREQUENCY, duration = BEEP_DURATION) {
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
    utterance.rate = SPEECH_RATE;
    speechSynthesis.speak(utterance);
}

function logTestSummary() {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const downloadedMB = (totalBytes / (1024 * 1024)).toFixed(2);
    const avg = speedStats.count
        ? (speedStats.sum / speedStats.count).toFixed(2)
        : "0.00";
    const min = speedStats.min === Infinity ? 0 : speedStats.min;
    addLog(
        `Результати тесту: час ${elapsed} с, дані ${downloadedMB} МБ, ` +
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
                    label: "Швидкість (Мбіт/с)",
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

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
        return null;
    }

    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

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

    if (currentGPSData.latitude && currentGPSData.longitude) {
        gpsStatusEl.textContent = "Активний";
        gpsStatusEl.style.color = "#4facfe";
        currentCoordsEl.textContent = `${currentGPSData.latitude.toFixed(
            6
        )}, ${currentGPSData.longitude.toFixed(6)}`;

        // Точність
        if (currentGPSData.accuracy) {
            gpsAccuracyEl.textContent = `±${currentGPSData.accuracy.toFixed(
                1
            )} м`;
            if (currentGPSData.accuracy < 10) {
                gpsAccuracyEl.style.color = "#4facfe";
            } else if (currentGPSData.accuracy < 50) {
                gpsAccuracyEl.style.color = "#a8e6cf";
            } else {
                gpsAccuracyEl.style.color = "#ff6b6b";
            }
        } else {
            gpsAccuracyEl.textContent = "N/A";
        }

        // Висота
        if (currentGPSData.altitude !== null) {
            altitudeInfoEl.textContent = `${currentGPSData.altitude.toFixed(
                1
            )} м`;
        } else {
            altitudeInfoEl.textContent = "N/A";
        }

        // GPS швидкість
        if (currentGPSData.speed !== null && currentGPSData.speed > 0) {
            gpsSpeedInfoEl.textContent = `${(
                currentGPSData.speed * 3.6
            ).toFixed(1)} км/год`;
        } else {
            gpsSpeedInfoEl.textContent = "N/A";
        }

        // Напрямок
        if (currentGPSData.heading !== null) {
            const directions = [
                "Пн",
                "ПнСх",
                "Сх",
                "ПдСх",
                "Пд",
                "ПдЗх",
                "Зх",
                "ПнЗх",
            ];
            const directionIndex =
                Math.round(currentGPSData.heading / 45) % directions.length;
            headingInfoEl.textContent = `${currentGPSData.heading.toFixed(
                0
            )}° (${directions[directionIndex]})`;
        } else {
            headingInfoEl.textContent = "N/A";
        }

        // Відстань від попередньої точки
        if (lastSavedGPSData.latitude && lastSavedGPSData.longitude) {
            const distance = calculateDistance(
                lastSavedGPSData.latitude,
                lastSavedGPSData.longitude,
                currentGPSData.latitude,
                currentGPSData.longitude
            );
            distanceInfoEl.textContent = `${distance.toFixed(1)} м`;

            if (distance > settings.gpsDistance) {
                distanceInfoEl.style.color = "#4facfe";
            } else {
                distanceInfoEl.style.color = "#ff6b6b";
            }
        } else {
            distanceInfoEl.textContent = "Перша точка";
            distanceInfoEl.style.color = "#a8e6cf";
        }

        // Загальна відстань
        totalDistanceInfoEl.textContent = `${(totalDistance / 1000).toFixed(
            2
        )} км`;
    } else {
        gpsStatusEl.textContent = "Очікування сигналу";
        gpsStatusEl.style.color = "#ff6b6b";
        currentCoordsEl.textContent = "N/A";
        distanceInfoEl.textContent = "N/A";
        gpsAccuracyEl.textContent = "N/A";
        altitudeInfoEl.textContent = "N/A";
        gpsSpeedInfoEl.textContent = "N/A";
        headingInfoEl.textContent = "N/A";
    }
}

function initGPS() {
    if (!navigator.geolocation) {
        addLog("GPS не підтримується браузером");
        document.getElementById("gpsStatus").textContent = "Не підтримується";
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
            document.getElementById("gpsStatus").textContent = "Помилка GPS";
            document.getElementById("gpsStatus").style.color = "#ff6b6b";
        },
        options
    );
}

function stopGPS() {
    if (gpsWatchId) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
        document.getElementById("gpsStatus").textContent = "Не активний";
        document.getElementById("gpsStatus").style.color = "white";
        addLog("GPS зупинено");
    }
}

function shouldSaveDataPoint() {
    if (!currentGPSData.latitude || !currentGPSData.longitude) {
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

    lastSavedGPSData = {
        latitude: currentGPSData.latitude,
        longitude: currentGPSData.longitude,
    };

    document.getElementById("lastSaveInfo").textContent =
        now.toLocaleTimeString();
    document.getElementById("lastSaveInfo").style.color = "#4facfe";

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
            '<div style="text-align: center; padding: 20px; opacity: 0.6;">Немає даних</div>';
        return;
    }

    dataDisplay.innerHTML = lastRecords
        .map(
            (record) => `
                <div class="data-row">
                    <div>${record.timestamp}</div>
                    <div>${record.speed.toFixed(2)}</div>
                    <div>${record.downloaded.toFixed(2)}</div>
                    <div>${record.latitude ? record.latitude.toFixed(6) : "N/A"
                }</div>
                    <div>${record.longitude ? record.longitude.toFixed(6) : "N/A"
                }</div>
                    <div>${record.altitude ? record.altitude.toFixed(1) + "m" : "N/A"
                }</div>
                    <div>${record.gpsSpeed
                    ? record.gpsSpeed.toFixed(1) + " км/год"
                    : "N/A"
                }</div>
                </div>
            `
        )
        .join("");
}

function updateRecordsCount() {
    document.getElementById("recordsCount").textContent = speedData.length;
    document.getElementById(
        "recordsInfo"
    ).textContent = `Записів: ${speedData.length}`;
}

function replaceSpacesWithUnderscore(str) {
  return str.replace(/ /g, '_');
}

function downloadData() {
    let dateStr = '';
    let timeStr = ''; 

    if (speedData.length === 0) {
        alert("Немає даних для завантаження");
        return;
    }

    // ✨  Додали три нові заголовки після "Час"
    const headers =
        "Часова мітка (мс);" +
        "Дата;" +
        "Час;" +
        "Оператор;" +
        "Швидкість (Мбіт/с);" +
        "Завантажено (МБ);" +
        "Тривалість (с);" +
        "Широта;" +
        "Довгота;" +
        "Висота (м);" +
        "GPS Швидкість (км/год);" +
        "Точність (м);" +
        "Напрямок (°)\n";

    const csvContent =
        headers +
        speedData
            .map((record) => {
                // Перевірка, якщо зберігали Date – використовуємо напряму, інакше створюємо об’єкт Date
                const ts =
                    record.fullTimestamp instanceof Date
                        ? record.fullTimestamp
                        : new Date(record.fullTimestamp);

                // Формати дати й часу з 2-цифровими компонентами
                dateStr = ts.toLocaleDateString("uk-UA", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                });
                timeStr = ts.toLocaleTimeString("uk-UA", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                });

                return (
                    `${ts.getTime()};` +                       // Часова мітка (мс)
                    `${dateStr};` +                           // Дата
                    `${timeStr};` +                           // Час (HH:MM:SS)
                    `${operator};` +
                    `${record.speed.toFixed(2)};` +
                    `${record.downloaded.toFixed(2)};` +
                    `${record.elapsed || ""};` +
                    `${record.latitude || ""};` +
                    `${record.longitude || ""};` +
                    `${record.altitude ? record.altitude.toFixed(0) : ""};` +
                    `${record.gpsSpeed ? record.gpsSpeed.toFixed(1) : ""};` +
                    `${record.accuracy ? record.accuracy.toFixed(1) : ""};` +
                    `${record.heading ? record.heading.toFixed(1) : ""};`
                );
            })
            .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${replaceSpacesWithUnderscore(operator)}_${dateStr}_${timeStr}.csv`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification("Дані завантажено!");
}



function exportChart() {
    if (!speedChart) return;

    const link = document.createElement("a");
    link.download = `speed_chart_${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
    link.href = speedChart.toBase64Image();
    link.click();

    showNotification("Графік експортовано!");
}

function clearData() {
    if (speedData.length === 0) return;

    if (confirm("Ви впевнені, що хочете очистити всі дані?")) {
        speedData = [];
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

        document.getElementById("lastSaveInfo").textContent = "Немає даних";
        document.getElementById("lastSaveInfo").style.color = "white";
        document.getElementById("avgSpeed").textContent = "0.00";
        document.getElementById("maxSpeed").textContent = "0.00";
        document.getElementById("minSpeed").textContent = "0.00 ";
        document.getElementById("totalDistanceInfo").textContent = "0.00";

        showNotification("Дані очищено!");
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
        document.getElementById("status").textContent = "Тест активний";

        // Ховаємо індикатор помилки
        document.getElementById("alertIndicator").style.display = "none";
    }

    document.getElementById("downloadedValue").textContent = `${(
        totalBytes /
        (1024 * 1024)
    ).toFixed(2)}`;
    document.getElementById("timeValue").textContent = `${Math.floor(
        elapsed
    )}`;
    document.getElementById("progressBar").style.width = `${Math.min(
        100,
        (totalBytes / TARGET) * 100
    )}%`;

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

  let resp = null,
      reader = null;

  while (testActive) {
    if (!testActive) break;
    resp = null;
    reader = null;
    try {
      addLog("Спроба завантаження…");
      // Перед кожним реальним тестом перевіримо, чи ми зараз офлайні?
      // Якщо isConnected === false, то засікаємо «retry until online»:
      if (!isConnected) {
        await waitForReconnect();
        if (!testActive) break;
      }

      // Коли вже точно онлайн, пробуємо робити реальний fetch
       resp = await fetchWithTimeout(
           `https://speed.cloudflare.com/__down?bytes=${TARGET}`,
        // `https://speedtest.tele2.net/1GB.zip`, 
        // `https://ash-speed.hetzner.com/1GB.bin`, 
        // `http://ipv4.download.thinkbroadband.com/1GB.zip`, 
        // { cache: "no-store", mode: "no-cors" },
           {},
        // Даємо більше часу на відповідь після втрати зв'язку,
        // щоб тест не падав одразу на мережах з високою затримкою
           BIG_FETCH_TIMEOUT
       );
      //resp = await fetch(`https://speed.cloudflare.com/__down?bytes=${TARGET}`);

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      // Якщо дійшли сюди — значить fetch успішний, а ми до цього були offline
      if (!isConnected) {
        isConnected = true;
        addLog("З'єднання відновлено!");
        document.getElementById("status").textContent = "Тест активний";
        showNotification("З'єднання відновлено!");
        playBeep(600, 200);
        speak("З'єднання відновлено");
      }

      reader = resp.body.getReader();
      consecutiveErrors = 0;

      // Починаємо читати дані потоково
      while (testActive) {
        if (!testActive) break;
        try {
          const readPromise = reader.read();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Read timeout")), STREAM_READ_TIMEOUT)
          );
          const { done, value } = await Promise.race([
            readPromise,
            timeoutPromise,
          ]);

          if (done) break;
          totalBytes += value.length;
        } catch (readError) {
          // Якщо timeout або помилка при читанні блокує подальша робота —
          // викидаємо в зовнішній catch, щоб зайти в «offline flow»
          addLog("Timeout при читанні даних");
          throw readError;
        }
      }
    } catch (e) {
      // Виходимо сюди, коли fetch впав або reader.read() кинув помилку
      if (e.message && e.message.includes('ERR_NETWORK_CHANGED')) {
        addLog('Network interface changed, retrying…');
        try { if (reader) reader.cancel(); } catch (err) { addLog('reader.cancel failed: ' + err.message); }
        try { if (resp) resp.body.cancel(); } catch (err) { addLog('body.cancel failed: ' + err.message); }
        continue;
      }
      isConnected = false;
      consecutiveErrors++;
      document.getElementById("speedValue").textContent = "0.00";
      document.getElementById("status").textContent = "Відсутнє з'єднання";
      document.getElementById("alertIndicator").style.display = "block";

      const errorMsg = e.name === "AbortError" ? "Timeout" : e.message;
      const elapsedErr = ((Date.now() - startTime) / 1000).toFixed(1);
      const downloadedErr = (totalBytes / (1024 * 1024)).toFixed(2);
      addLog(
        `Помилка з'єднання: ${errorMsg}; передано ${downloadedErr} МБ за ${elapsedErr} с ` +
        `(${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})`
      );
      playBeep(300, 500);
      if (consecutiveErrors === 1) {
        showNotification("Втрачено з'єднання!");
        speak("Втрачено з'єднання з інтернетом");
      }

      // Запускаємо чек повторного підключення — всередині waitForReconnect()
      // функція довго не блокує UI, а кожні N мс робить запит bytes=1 для перевірки.
      // Після успіху вона поверне керування сюди, а ми знову зайдемо у верхню try{} й запустимо реальний тест.
      try { if (reader) reader.cancel(); } catch (e) { addLog('reader.cancel failed: ' + e.message); }
      try { if (resp) resp.body.cancel(); } catch (e) { addLog('body.cancel failed: ' + e.message); }
      await waitForReconnect();
      if (!testActive) break;
      // Після повернення з waitForReconnect, переходимо до нового кола зовнішнього while:
      continue;
    }

    // Якщо testActive === true і isConnected === true — невелика пауза 0.5 с
    if (testActive && isConnected) {
      await new Promise((r) => setTimeout(r, RUN_LOOP_PAUSE));
    }
  }

  // Коли юзер натисне «Стоп», виходимо із зовнішнього циклу:
  clearInterval(updateInterval);
  clearInterval(dataInterval);
  document.getElementById("status").textContent = "Тест зупинено";
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
      // Після відновлення з'єднання скидаємо лічильники та статистику
      totalBytes = 0;
      prevBytes = 0;
      startTime = Date.now();
      speedStats = { min: Infinity, max: 0, sum: 0, count: 0 };
      chartData = [];

      // Оновлюємо залежні елементи інтерфейсу
      document.getElementById('downloadedValue').textContent = '0.00';
      document.getElementById('timeValue').textContent = '0';
      document.getElementById('speedValue').textContent = '0.00';
      document.getElementById('avgSpeed').textContent = '0.00';
      document.getElementById('maxSpeed').textContent = '0.00';
      document.getElementById('minSpeed').textContent = '0.00';
      document.getElementById('progressBar').style.width = '0%';
      if (speedChart) {
        speedChart.data.labels = [];
        speedChart.data.datasets[0].data = [];
        speedChart.update();
      }
      break;
    }

    await new Promise((r) => setTimeout(r, RECONNECT_RETRY_INTERVAL));
  }
}

async function toggleTest() {
    if (testInProgress && testActive) {
        testActive = false;
        document.getElementById("startBtn").textContent = "Почати тест";
        addLog("Зупинка тесту...");
        showNotification("Тест зупинено!");
        return;
    }

    if (!testInProgress) {
        testActive = true;
        document.getElementById("startBtn").textContent = "Зупинити тест";
        addLog("Старт тесту");
        showNotification("Тест запущено!");

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
        `Переключено на ${newTheme === "dark" ? "темну" : "світлу"} тему`
    );
}

function toggleFullscreen() {
    const body = document.body;
    isFullscreen = !isFullscreen;

    if (isFullscreen) {
        body.classList.add("fullscreen-mode");
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        }
        showNotification("Повноекранний режим увімкнено");
    } else {
        body.classList.remove("fullscreen-mode");
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        showNotification("Повноекранний режим вимкнено");
    }
}

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

    // Перезапускаємо інтервал збереження якщо тест активний
    if (testActive && dataInterval) {
        clearInterval(dataInterval);
        dataInterval = setInterval(
            saveDataPoint,
            settings.saveInterval * 1000
        );
    }

    showNotification("Налаштування збережено!");
    toggleSettings();
}

function loadSettings() {
    document.getElementById("saveInterval").value = settings.saveInterval;
    document.getElementById("gpsDistance").value = settings.gpsDistance;
    document.getElementById("speedThreshold").value =
        settings.speedThreshold;
    document.getElementById("soundAlerts").checked = settings.soundAlerts;
    document.getElementById("voiceAlerts").checked = settings.voiceAlerts;
}

// Ініціалізація при завантаженні
window.addEventListener("load", () => {
    initChart();
    loadSettings();
    updateGPSInfo();

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

