function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", newTheme);
    localStorage.setItem('theme', newTheme);

    setThemeColor(newTheme);

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
        setThemeColor(storedTheme);
    }
}

function setThemeColor(theme) {
    const themeColorMeta = document.getElementById('themeColorMeta');
    if (themeColorMeta) {
        themeColorMeta.content = theme === 'dark' ? '#1a1a2e' : '#667eea';
    }
}