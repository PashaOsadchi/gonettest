function updateSpeedDistribution() {
    const stats = {
        total: 0,
        zero: 0,
        upto2: 0,
        above2: 0,
        distZero: 0,
        distUpto2: 0,
        distAbove2: 0,
    };

    for (const rec of speedData) {
        const speed = rec.speed;
        if (typeof speed !== "number" || speed < 0 || Number.isNaN(speed)) {
            continue;
        }
        const dist = Number(rec.distance);
        const validDist = Number.isFinite(dist) && dist >= 0 ? dist : 0;
        accumulateSpeedStats(stats, speed, validDist);
    }

    const total = stats.total;
    const setCount = (id, count, showPercent = true) => {
        const el = document.getElementById(id);
        if (el) {
            if (showPercent) {
                const percent = total ? Math.round((count / total) * 100) : 0;
                el.textContent = `${count} (${percent}%)`;
            } else {
                el.textContent = `${count}`;
            }
        }
    };

    setCount("allSpeedCount", stats.total, false);
    setCount("zeroSpeedCount", stats.zero);
    setCount("upto2SpeedCount", stats.upto2);
    setCount("above2SpeedCount", stats.above2);

    const totalDist = stats.distZero + stats.distUpto2 + stats.distAbove2;
    const unit = typeof currentLang !== 'undefined' && currentLang === 'en' ? 'km' : 'км';

    const setDist = (id, dist, showPercent = true) => {
        const el = document.getElementById(id);
        if (el) {
            const km = dist / 1000;
            if (showPercent) {
                const percent = totalDist ? Math.round((dist / totalDist) * 100) : 0;
                el.textContent = `${km.toFixed(1)} ${unit} (${percent}%)`;
            } else {
                el.textContent = `${km.toFixed(1)} ${unit}`;
            }
        }
    };

    setDist("allDist", totalDist, false);
    setDist("distZero", stats.distZero);
    setDist("distUpto2", stats.distUpto2);
    setDist("distAbove2", stats.distAbove2);
}

