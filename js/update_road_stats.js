const roadLengthMap = new Map();
let roadLengthsLoaded = false;

function escapeHtml(str) {
    const doc = new DOMParser().parseFromString(str, 'text/html');
    return doc.body.textContent || '';
}

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
            const len = Number(p.distance);
            if (!Number.isFinite(len)) continue;
            const existing = roadLengthMap.get(ref);
            const currentLen = Number.isFinite(existing) ? existing : 0;
            roadLengthMap.set(ref, currentLen + len);
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
        const dist = Number(rec.distance) || 0;
        const validDist = Number.isFinite(dist) && dist >= 0 ? dist : 0;
        accumulateSpeedStats(s, rec.speed, validDist);
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
        const zp = s.total > 0 ? Math.round((s.zero / s.total) * 100) : 0;
        const up = s.total > 0 ? Math.round((s.upto2 / s.total) * 100) : 0;
        const ap = s.total > 0 ? Math.round((s.above2 / s.total) * 100) : 0;
        const zKm = s.distZero / 1000;
        const uKm = s.distUpto2 / 1000;
        const aKm = s.distAbove2 / 1000;
        const coveredKm = (s.distZero + s.distUpto2 + s.distAbove2) / 1000;
        const zl = s.length ? Math.round((zKm / s.length) * 100) : 0;
        const ul = s.length ? Math.round((uKm / s.length) * 100) : 0;
        const al = s.length ? Math.round((aKm / s.length) * 100) : 0;
        const tl = s.length ? Math.round((coveredKm / s.length) * 100) : 0;
        const lenUnit = currentLang === 'uk' ? 'км' : 'km';
        const lenStr = coveredKm ? `${coveredKm.toFixed(1)} ${lenUnit}` : '-';я
        const roadLenStr = coveredKm ? `${lenStr} (${tl}%)` : '-';
        const zpStr = s.total > 0 ? `${zp}%` : '0%';
        const upStr = s.total > 0 ? `${up}%` : '0%';
        const apStr = s.total > 0 ? `${ap}%` : '0%';
        rows.push(
            `<div class="info-row road-toggle" data-target="${roadId}"><span><i data-lucide="plus"></i> ${escapeHtml(road)}</span><span>${s.total} (${lenStr})</span></div>` +
            `<div id="${roadId}" class="road-content hidden" style="padding-left:30px">` +
            `<div class="info-row"><span>${t('testsPercentTotal', 'Тестів:')}</span><span>${s.total}</span></div>` +
            `<div class="info-row"><span>${t('zeroSpeedLabel', '0 Мбіт/с (% від кількості):')}</span><span>${s.zero} (${zpStr})</span></div>` +
            `<div class="info-row"><span>${t('upTo2SpeedLabel', 'До 2 Мбіт/с (% від кількості):')}</span><span>${s.upto2} (${upStr})</span></div>` +
            `<div class="info-row"><span>${t('above2SpeedLabel', 'Більше 2 Мбіт/с (% від кількості):')}</span><span>${s.above2} (${apStr})</span></div>` +
            `<div class="info-row"><span>${t('distancePercentRoad', 'Відстань:')}</span><span>${roadLenStr}</span></div>` +
            `<div class="info-row"><span>${t('zeroSpeedLabel2','0 Мбіт/с (% від протяжності):')}</span><span>${zKm.toFixed(1)} ${lenUnit} (${zl}%)</span></div>` +
            `<div class="info-row"><span>${t('upTo2SpeedLabel2','До 2 Мбіт/с (% від протяжності):')}</span><span>${uKm.toFixed(1)} ${lenUnit} (${ul}%)</span></div>` +
            `<div class="info-row"><span>${t('above2SpeedLabel2','Більше 2 Мбіт/с (% від протяжності):')}</span><span>${aKm.toFixed(1)} ${lenUnit} (${al}%)</span></div>` +
            `</div>`
        );
    }

    container.innerHTML = rows.join('');
    if (window.lucide) lucide.createIcons({ strokeWidth: 1.2, class: 'h-4 w-4' });

    setupToggle(container, '.road-toggle');
}
