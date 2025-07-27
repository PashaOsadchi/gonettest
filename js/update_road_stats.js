function updateRoadStats() {
    const container = document.getElementById('roadStatsContent');
    if (!container) return;

    const stats = {};
    for (const rec of speedData) {
        if (!rec.roadRef) continue;
        if (!stats[rec.roadRef]) {
            stats[rec.roadRef] = { total: 0, zero: 0, upto2: 0, above2: 0 };
        }
        const s = stats[rec.roadRef];
        s.total++;
        if (rec.speed === 0) {
            s.zero++;
        } else if (rec.speed > 0 && rec.speed <= 2) {
            s.upto2++;
        } else {
            s.above2++;
        }
    }

    const keys = Object.keys(stats).sort();
    if (keys.length === 0) {
        container.innerHTML = `<div class="info-row"><span>${t('noData', 'Немає даних')}</span><span></span></div>`;
        return;
    }

    const rows = [];
    for (const road of keys) {
        const s = stats[road];
        const zp = Math.round((s.zero / s.total) * 100);
        const up = Math.round((s.upto2 / s.total) * 100);
        const ap = Math.round((s.above2 / s.total) * 100);
        rows.push(
            `<div class="info-row"><span>${road}</span><span>${s.total}</span></div>` +
            `<div class="info-row"><span>${t('zeroSpeedLabel', '0 Мбіт/с:')}</span><span>${s.zero} (${zp}%)</span></div>` +
            `<div class="info-row"><span>${t('upTo2SpeedLabel', 'До 2 Мбіт/с:')}</span><span>${s.upto2} (${up}%)</span></div>` +
            `<div class="info-row"><span>${t('above2SpeedLabel', 'Більше 2 Мбіт/с:')}</span><span>${s.above2} (${ap}%)</span></div>`
        );
    }

    container.innerHTML = rows.join('');
}
