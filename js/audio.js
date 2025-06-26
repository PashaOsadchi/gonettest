// Audio and notification utilities
const NOTIFICATION_DURATION = 3000;
const BEEP_FREQUENCY = 800;
const BEEP_DURATION = 200;
const SPEECH_RATE = 0.8;

let audioContext = null;
let speechSynthesis = window.speechSynthesis;

export function showNotification(message, duration = NOTIFICATION_DURATION) {
  const notification = document.getElementById('notification');
  if (!notification) return;
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, duration);
}

export function playBeep(frequency = BEEP_FREQUENCY, duration = BEEP_DURATION) {
  if (!window.settings || !window.settings.soundAlerts) return;
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (e) {
    console.log('Audio error:', e);
  }
}

export function speak(text) {
  if (!window.settings || !window.settings.voiceAlerts || !speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'uk-UA';
  utterance.rate = SPEECH_RATE;
  speechSynthesis.speak(utterance);
}
