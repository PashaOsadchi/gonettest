const roadLengthCache = {};
function getRoadLength(ref) {
    if (roadLengthCache[ref] !== undefined) return roadLengthCache[ref];
    const types = ['international','national','regional','territorial'];
    for (const type of types) {
        const data = roadData[type];
        if (!data) continue;
        for (const f of data.features) {
            const p = f.properties || {};
            if (p.ref === ref) {
                const len = parseFloat(p.distance);
                roadLengthCache[ref] = isNaN(len) ? 0 : len;
                return roadLengthCache[ref];
            }
        }
    }
    roadLengthCache[ref] = 0;
    return 0;
}

function updateRoadStats() {
    const container = document.getElementById('roadStatsContent');
    if (!container) return;

    const stats = {};
    for (const rec of speedData) {
        if (!rec.roadRef) continue;
        if (!stats[rec.roadRef]) {
            stats[rec.roadRef] = {
                total: 0, zero: 0, upto2: 0, above2: 0,
                distZero: 0, distUpto2: 0, distAbove2: 0,
                length: getRoadLength(rec.roadRef)
            };
        }
        const s = stats[rec.roadRef];
        s.total++;
        const dist = rec.distance || 0;
        if (rec.speed === 0) {
            s.zero++;
            s.distZero += dist;
        } else if (rec.speed > 0 && rec.speed <= 2) {
            s.upto2++;
            s.distUpto2 += dist;
        } else {
            s.above2++;
            s.distAbove2 += dist;
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
        const zKm = s.distZero / 1000;
        const uKm = s.distUpto2 / 1000;
        const aKm = s.distAbove2 / 1000;
        const zl = s.length ? Math.round((zKm / s.length) * 100) : 0;
        const ul = s.length ? Math.round((uKm / s.length) * 100) : 0;
        const al = s.length ? Math.round((aKm / s.length) * 100) : 0;
        rows.push(
            `<div class="info-row"><span>${road}</span><span>${s.total}</span></div>` +
            `<div class="info-row"><span>Тестів (% від загальної кількості)</span></div>` +
            `<div class="info-row"><span>${t('zeroSpeedLabel', '0 Мбіт/с:')}</span><span>${s.zero} (${zp}%)</span></div>` +
            `<div class="info-row"><span>${t('upTo2SpeedLabel', 'До 2 Мбіт/с:')}</span><span>${s.upto2} (${up}%)</span></div>` +
            `<div class="info-row"><span>${t('above2SpeedLabel', 'Більше 2 Мбіт/с:')}</span><span>${s.above2} (${ap}%)</span></div>` +
            `<div class="info-row"><span>Відстань (% від загальної протяжності дорги)</span></div>` +
            `<div class="info-row"><span>${t('zeroSpeedLabel','0 Мбіт/с:')}</span><span>${zKm.toFixed(1)} (${zl}%)</span></div>` +
            `<div class="info-row"><span>${t('upTo2SpeedLabel','До 2 Мбіт/с:')}</span><span>${uKm.toFixed(1)} (${ul}%)</span></div>` +
            `<div class="info-row"><span>${t('above2SpeedLabel','Більше 2 Мбіт/с:')}</span><span>${aKm.toFixed(1)} (${al}%)</span></div>`
        );
    }

    container.innerHTML = rows.join('');
}
