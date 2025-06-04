// Глобальні змінні
let testActive = false;
let totalBytes = 0,
    prevBytes = 0,
    startTime = 0,
    updateInterval = null;
const TARGET = 100 * 1024 * 1024 * 1024;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 1000;
let isConnected = true;
let isFullscreen = false;

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
    saveInterval: 1,
    gpsDistance: 1,
    speedThreshold: 1,
    soundAlerts: true,
    voiceAlerts: false,
};

// Графік
let speedChart = null;
let chartData = [];
let maxDataPoints = 60; // Показуємо останні 60 точок

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
    }
}
detectISP();

// Звукові контексти
let audioContext = null;
let speechSynthesis = window.speechSynthesis;

function addLog(msg) {
    console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function showNotification(message, duration = 3000) {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.style.display = "block";
    setTimeout(() => {
        notification.style.display = "none";
    }, duration);
}

function playBeep(frequency = 800, duration = 200) {
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
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
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
        )} Мбіт/с`;
        document.getElementById(
            "maxSpeed"
        ).textContent = `${speedStats.max.toFixed(2)} Мбіт/с`;
        document.getElementById("minSpeed").textContent =
            speedStats.min === Infinity
                ? "0.00 Мбіт/с"
                : `${speedStats.min.toFixed(2)} Мбіт/с`;

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
            const directionIndex = Math.round(currentGPSData.heading / 45) % 8;
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
        timeout: 5000,
        maximumAge: 1000,
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
    link.download = `speed_test_gps_${dateStr}_${timeStr}.csv`;
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
        document.getElementById("avgSpeed").textContent = "0.00 Мбіт/с";
        document.getElementById("maxSpeed").textContent = "0.00 Мбіт/с";
        document.getElementById("minSpeed").textContent = "0.00 Мбіт/с";
        document.getElementById("totalDistanceInfo").textContent = "0.00 км";

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
    ).toFixed(2)} МБ`;
    document.getElementById("timeValue").textContent = `${Math.floor(
        elapsed
    )} с`;
    document.getElementById("progressBar").style.width = `${Math.min(
        100,
        (totalBytes / TARGET) * 100
    )}%`;

    updateGPSInfo();
    updateChart();
    updateStats();
}

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
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

async function runTest() {
  startTime = Date.now();
  prevBytes = totalBytes = 0;
  consecutiveErrors = 0;
  // Запускаємо оновлення UI що секунду
  updateInterval = setInterval(updateUI, 1000);
  // Запускаємо періодичне збереження точок даних
  dataInterval = setInterval(saveDataPoint, settings.saveInterval * 1000);

  while (testActive) {
    try {
      addLog("Спроба завантаження…");
      // Перед кожним реальним тестом перевіримо, чи ми зараз офлайні?
      // Якщо isConnected === false, то засікаємо «retry until online»:
      if (!isConnected) {
        await waitForReconnect();
      }

      // Коли вже точно онлайн, пробуємо робити реальний fetch
      const resp = await fetchWithTimeout(
        `https://speed.cloudflare.com/__down?bytes=${TARGET}`,
        { cache: "no-store" },
        10000
      );

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

      const reader = resp.body.getReader();
      consecutiveErrors = 0;

      // Починаємо читати дані потоково
      while (testActive) {
        try {
          const readPromise = reader.read();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Read timeout")), 5000)
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
      isConnected = false;
      consecutiveErrors++;
      document.getElementById("speedValue").textContent = "0.00";
      document.getElementById("status").textContent = "Відсутнє з'єднання";
      document.getElementById("alertIndicator").style.display = "block";

      const errorMsg = e.name === "AbortError" ? "Timeout" : e.message;
      addLog(`Помилка: ${errorMsg} (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})`);
      playBeep(300, 500);
      if (consecutiveErrors === 1) {
        showNotification("Втрачено з'єднання!");
        speak("Втрачено з'єднання з інтернетом");
      }

      // Запускаємо чек повторного підключення — всередині waitForReconnect()
      // функція довго не блокує UI, а кожні N мс робить запит bytes=1 для перевірки.
      // Після успіху вона поверне керування сюди, а ми знову зайдемо у верхню try{} й запустимо реальний тест.
      try { reader.cancel(); } catch (_) {}
      try { resp.body.cancel(); } catch (_) {}
      await waitForReconnect();
      // Після повернення з waitForReconnect, переходимо до нового кола зовнішнього while:
      continue;
    }

    // Якщо testActive === true і isConnected === true — невелика пауза 0.5 с
    if (testActive && isConnected) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Коли юзер натисне «Стоп», виходимо із зовнішнього циклу:
  clearInterval(updateInterval);
  clearInterval(dataInterval);
  document.getElementById("status").textContent = "Тест зупинено";
  document.getElementById("alertIndicator").style.display = "none";
}

// Окрема допоміжна функція, яка повертається лише тоді, коли перевірка
// (fetch із bytes=1) проходить успішно — тобто мережа з’явилася.
async function waitForReconnect() {
  const checkUrl = `https://speed.cloudflare.com/__down?bytes=100`;

  // Поки тест активний і мережі немає — пробуємо кожні 500 мс відправити маленький запит
  while (testActive && !isConnected) {
    try {
      addLog("Перевірка з'єднання…");
      const resp = await fetchWithTimeout(checkUrl, { cache: "no-store" }, 500);
      if (resp.ok) {
        // Якщо принаймні одиничний байт вдалося завантажити — вважаємо, що ми вже онлайн
        isConnected = true;
        break;
      }
    } catch {
      // Якщо знову offline — просто чекаємо 500 мс і пробуємо ще
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

function toggleTest() {
    testActive = !testActive;
    document.getElementById("startBtn").textContent = testActive
        ? "Зупинити тест"
        : "Почати тест";
    addLog(testActive ? "Старт тесту" : "Зупинка тесту");

    if (testActive) {
        isConnected = true;
        initGPS();
        runTest();
        showNotification("Тест запущено!");
    } else {
        stopGPS();
        showNotification("Тест зупинено!");
    }
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", newTheme);

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
    }, 100);
});