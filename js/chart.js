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