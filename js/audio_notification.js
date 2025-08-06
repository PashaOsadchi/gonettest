// Звукові контексти
let audioContext = null;
let speechSynthesis = window.speechSynthesis;

function showNotification(message, duration = NOTIFICATION_DURATION) {
    const notification = document.getElementById("notification");
    if (!notification) {
        console.warn("Notification element not found");
        return;
    }
    notification.textContent = message;
    notification.style.display = "block";
    setTimeout(() => {
        notification.style.display = "none";
    }, duration);
}

function playBeep(frequency = BEEP_FREQUENCY, duration = BEEP_DURATION) {
    if (!window.settings || !window.settings.soundAlerts) return;

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
    if (!speechSynthesis) return;
    speechSynthesis.cancel();
    if (typeof SpeechSynthesisUtterance === 'undefined') return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "uk-UA";
    utterance.rate = SPEECH_RATE;
    speechSynthesis.speak(utterance);
}
