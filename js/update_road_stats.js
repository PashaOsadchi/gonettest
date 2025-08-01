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
        const lenUnit = currentLang === 'uk' ? 'км' : 'km';
        const lenStr = coveredKm ? `${coveredKm.toFixed(1)} ${lenUnit}` : '-';
        rows.push(
            `<div class="info-row road-toggle" data-target="${roadId}"><span><i data-lucide="plus"></i> ${road}</span><span>${s.total} (${lenStr})</span></div>` +
            `<div id="${roadId}" class="road-content hidden" style="padding-left:20px">` +
            `<div class="info-row"><span>Тестів (% від загальної кількості)</span></div>` +
            `<div class="info-row" style="--indent:20px"><span>${t('zeroSpeedLabel', '0 Мбіт/с:')}</span><span>${s.zero} (${zp}%)</span></div>` +
            `<div class="info-row" style="--indent:20px"><span>${t('upTo2SpeedLabel', 'До 2 Мбіт/с:')}</span><span>${s.upto2} (${up}%)</span></div>` +
            `<div class="info-row" style="--indent:20px"><span>${t('above2SpeedLabel', 'Більше 2 Мбіт/с:')}</span><span>${s.above2} (${ap}%)</span></div>` +
            `<div class="info-row" style="--indent:20px"><span>Відстань (% від загальної протяжності дорги)</span></div>` +
            `<div class="info-row" style="--indent:20px"><span>${t('zeroSpeedLabel','0 Мбіт/с:')}</span><span>${zKm.toFixed(1)} (${zl}%)</span></div>` +
            `<div class="info-row" style="--indent:20px"><span>${t('upTo2SpeedLabel','До 2 Мбіт/с:')}</span><span>${uKm.toFixed(1)} (${ul}%)</span></div>` +
            `<div class="info-row" style="--indent:20px"><span>${t('above2SpeedLabel','Більше 2 Мбіт/с:')}</span><span>${aKm.toFixed(1)} (${al}%)</span></div>` +
            `</div>`
        );
    }

    container.innerHTML = rows.join('');
    if (window.lucide) lucide.createIcons({ strokeWidth: 1.2, class: 'h-4 w-4' });

    container.querySelectorAll('.road-toggle').forEach(el => {
        const target = el.dataset.target;
        const icon = el.querySelector('i');
        el.addEventListener('click', () => {
            const cont = document.getElementById(target);
            if (!cont) return;
            cont.classList.toggle('hidden');
            if (icon) {
                icon.setAttribute('data-lucide', cont.classList.contains('hidden') ? 'plus' : 'minus');
                if (window.lucide) lucide.createIcons({ strokeWidth: 1.2, class: 'h-4 w-4' });
            }
        });
    });
}
