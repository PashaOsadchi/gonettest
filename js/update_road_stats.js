const roadLengthMap = new Map();
let roadLengthsLoaded = false;

function buildRoadLengthMap() {
    if (roadLengthsLoaded) return;
    const types = ['international', 'national', 'regional', 'territorial'];
    for (const type of types) {
        const data = roadData[type];
        if (!data) continue;
        for (const f of data.features) {
            const p = f.properties || {};
            const ref = p.ref && String(p.ref).trim();
            if (!ref) continue;
            const len = parseFloat(p.distance);
            roadLengthMap.set(ref, isNaN(len) ? 0 : len);
        }
    }
    roadLengthsLoaded = true;
}

function getRoadLength(ref) {
    if (!roadLengthsLoaded) buildRoadLengthMap();
    return roadLengthMap.get(ref) || 0;
}

function updateRoadStats() {
    const container = document.getElementById('roadStatsContent');
    if (!container) return;

    const stats = {};
    for (const rec of speedData) {
        const ref = rec.roadRef && String(rec.roadRef).trim();
        if (!ref) continue;
        if (!Object.prototype.hasOwnProperty.call(stats, ref)) {
            stats[ref] = {
                total: 0, zero: 0, upto2: 0, above2: 0,
                distZero: 0, distUpto2: 0, distAbove2: 0,
                length: getRoadLength(ref)
            };
        }
        const s = stats[ref];
        const dist = rec.distance || 0;
        accumulateSpeedStats(s, rec.speed, dist);
    }

    const keys = Object.keys(stats).sort();
    if (keys.length === 0) {
        container.innerHTML = `<div class="info-row"><span>${t('noData', 'Немає даних')}</span><span></span></div>`;
        return;
    }

    const rows = [];
    let id = 0;
    for (const road of keys) {
        const s = stats[road];
        const roadId = `road-${id++}`;
        const zp = Math.round((s.zero / s.total) * 100);
        const up = Math.round((s.upto2 / s.total) * 100);
        const ap = Math.round((s.above2 / s.total) * 100);
        const zKm = s.distZero / 1000;
        const uKm = s.distUpto2 / 1000;
        const aKm = s.distAbove2 / 1000;
        const coveredKm = (s.distZero + s.distUpto2 + s.distAbove2) / 1000;
        const zl = s.length ? Math.round((zKm / s.length) * 100) : 0;
        const ul = s.length ? Math.round((uKm / s.length) * 100) : 0;
        const al = s.length ? Math.round((aKm / s.length) * 100) : 0;
        const tl = s.length ? Math.round((coveredKm / s.length) * 100) : 0;
        const lenUnit = currentLang === 'uk' ? 'км' : 'km';
        const lenStr = coveredKm ? `${coveredKm.toFixed(1)} ${lenUnit}` : '-';
        const roadLenStr = coveredKm ? `${lenStr} (${tl}%)` : '-';
        rows.push(
            `<div class="info-row road-toggle" data-target="${roadId}"><span><i data-lucide="plus"></i> ${road} тестів (відстань км)</span><span>${s.total} (${lenStr})</span></div>` +
            `<div id="${roadId}" class="road-content hidden" style="padding-left:20px">` +
            `<div class="info-row"><span>${t('testsPercentTotal', 'Тестів:')}</span><span>${s.total}</span></div>` +
            `<div class="info-row"><span>${t('zeroSpeedLabel', '0 Мбіт/с (% від загальної кількості):')}</span><span>${s.zero} (${zp}%)</span></div>` +
            `<div class="info-row"><span>${t('upTo2SpeedLabel', 'До 2 Мбіт/с (% від загальної кількості):')}</span><span>${s.upto2} (${up}%)</span></div>` +
            `<div class="info-row"><span>${t('above2SpeedLabel', 'Більше 2 Мбіт/с (% від загальної кількості):')}</span><span>${s.above2} (${ap}%)</span></div>` +
            `<div class="info-row"><span>${t('distancePercentRoad', 'Відстань:')}</span><span>${roadLenStr}</span></div>` +
            `<div class="info-row"><span>${t('zeroSpeedLabel','0 Мбіт/с (% від загальної протяжності дороги):')}</span><span>${zKm.toFixed(1)} (${zl}%)</span></div>` +
            `<div class="info-row"><span>${t('upTo2SpeedLabel','До 2 Мбіт/с (% від загальної протяжності дороги):')}</span><span>${uKm.toFixed(1)} (${ul}%)</span></div>` +
            `<div class="info-row"><span>${t('above2SpeedLabel','Більше 2 Мбіт/с (% від загальної протяжності дороги):')}</span><span>${aKm.toFixed(1)} (${al}%)</span></div>` +
            `</div>`
        );
    }

    container.innerHTML = rows.join('');
    if (window.lucide) lucide.createIcons({ strokeWidth: 1.2, class: 'h-4 w-4' });

    setupToggle(container, '.road-toggle');
}
