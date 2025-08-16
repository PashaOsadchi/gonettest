import { requestWakeLock } from './wake_lock.js';

async function resetTestState() {
    testInProgress = false;
    pendingRun = false;
    consecutiveErrors = 0;

    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    if (dataInterval) {
        clearInterval(dataInterval);
        dataInterval = null;
    }

    isConnected = await checkRealConnection();

    const statusEl = document.getElementById("status");
    const speedValueEl = document.getElementById("speedValue");
    const alertIndicatorEl = document.getElementById("alertIndicator");

    if (isConnected) {
        statusEl.textContent = t('statusReady', 'Натисніть "Почати тест"');
        alertIndicatorEl.style.display = "none";
    } else {
        statusEl.textContent = t('statusNoConnection', 'Відсутнє з\'єднання');
        alertIndicatorEl.style.display = "block";
    }
    speedValueEl.textContent = "0.00";
    currentSpeedMbps = 0;
}

function updateSpeedPerSecond(bytes, elapsedMs) {
    const speedMbps = elapsedMs > 0
        ? (bytes * 8) / (elapsedMs / 1000) / (1024 * 1024)
        : 0;
    currentSpeedMbps = speedMbps;
    document.getElementById("speedValue").textContent = speedMbps.toFixed(2);
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

async function readWithTimeout(reader, timeout = STREAM_READ_TIMEOUT) {
    let timer;
    try {
        return await Promise.race([
            reader.read(),
            new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error('Stream read timeout')), timeout);
            })
        ]);
    } finally {
        clearTimeout(timer);
    }
}

async function checkRealConnection() {
    try {
        await fetchWithTimeout(
            NETWORK_CHECK_URL,
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
        let bytesSinceLastUpdate = 0;
        const start = performance.now();
        let lastUpdate = start;

    while (true) {
        let chunk;
        try {
            chunk = await readWithTimeout(reader, STREAM_READ_TIMEOUT);
        } catch (e) {
            activeDownloadController.abort();
            throw e;
        }
        const { done, value } = chunk;
        if (done) break;
        if (!testActive) {
            activeDownloadController.abort();
            throw new DOMException('Aborted', 'AbortError');
        }
        bytes += value.length;
        bytesSinceLastUpdate += value.length;
        totalBytes += value.length;

        const now = performance.now();
        if (now - lastUpdate >= 1000) {
            updateSpeedPerSecond(bytesSinceLastUpdate, now - lastUpdate);
            lastUpdate = now;
            bytesSinceLastUpdate = 0;
        }

        if (bytes >= TARGET) {
            try { await reader.cancel(); } catch (e) {}
            break;
        }
    }

        const nowFinal = performance.now();
        if (bytesSinceLastUpdate > 0 && nowFinal > lastUpdate) {
            updateSpeedPerSecond(bytesSinceLastUpdate, nowFinal - lastUpdate);
            bytesSinceLastUpdate = 0;
        }

        const duration = (nowFinal - start) / 1000;
        const speedMbps = (bytes * 8) / (duration * 1024 * 1024);
        return { speedMbps, bytes };
    } finally {
        clearTimeout(timeoutId);
        activeDownloadController = null;
    }
}

async function runTest() {
  if (!testActive) {
    await resetTestState();
    return;
  }

  if (testInProgress) {
    pendingRun = true;
    return;
  }
  testInProgress = true;
  pendingRun = false;
  startTime = Date.now();
  lastSavedTime = startTime;
  prevBytes = totalBytes = 0;
  lastSavedBytes = 0;
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

      await measureDownloadSpeed();
      consecutiveErrors = 0;
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
      currentSpeedMbps = 0;
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
          if (settings.voiceAlerts) {
            speak("Втрачено з'єднання з інтернетом");
          }
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
  await resetTestState();
  logTestSummary();
}

// Окрема допоміжна функція, яка повертається лише тоді, коли перевірка
// (fetch із bytes=1) проходить успішно — тобто мережа з’явилася.
async function waitForReconnect() {
  // Використовуємо мінімальний 1-байтовий запит для перевірки доступності
  const checkUrl = NETWORK_CHECK_URL;

  // Поки тест активний і мережі немає — пробуємо кожні 500 мс відправити маленький запит
  while (testActive && !isConnected) {
    if (!testActive) return;
    addLog("Перевірка з'єднання…");

    try {
      await fetchWithTimeout(
        checkUrl,
        { cache: "no-store", mode: "no-cors" },
        RECONNECT_TIMEOUT
      );
      // Навіть без CORS, якщо запит завершився успішно — мережа присутня
      isConnected = true;
      break;
    } catch (e) {
      addLog('waitForReconnect error: ' + e.message);
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
        const startBtn = document.getElementById("startBtn");
        startBtn.disabled = true;
        startBtn.textContent = t('stopTest', 'Зупинити тест');

        try {
            await requestWakeLock();
            await detectISP();
        } catch (error) {
            testActive = false;
            await resetTestState();
            startBtn.textContent = t('startTest', 'Почати тест');
            startBtn.disabled = false;
            addLog("Не вдалося запустити тест");
            showNotification(t('testStartFailed', 'Не вдалося запустити тест'));
            console.error('toggleTest error:', error);
            return;
        }

        addLog("Старт тесту");
        showNotification(t('testStarted', 'Тест запущено!'));
        initMapIfNeeded();

        isConnected = await checkRealConnection();
        initGPS();
        runTest();
        startBtn.disabled = false;
    }
}

document.getElementById('startBtn').addEventListener('click', toggleTest);

