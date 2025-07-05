function formatSeconds(totalSeconds) {
    // Обчислюємо години, хвилини та секунди
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    // Створюємо масив для збереження частин часу
    const timeParts = [];
    
    const hLabel = t('hoursShort', 'h');
    const mLabel = t('minutesShort', 'm');
    const sLabel = t('secondsShort', 's');

    // Додаємо години, якщо є
    if (hours > 0) {
        timeParts.push(`${hours}${hLabel}`);
    }

    // Додаємо хвилини, якщо є
    if (minutes > 0) {
        timeParts.push(`${minutes}${mLabel}`);
    }

    // Додаємо секунди, якщо є або якщо це єдина частина
    if (seconds > 0 || timeParts.length === 0) {
        timeParts.push(`${seconds}${sLabel}`);
    }
    
    // З'єднуємо частини через пробіл
    return timeParts.join(' ');
}