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