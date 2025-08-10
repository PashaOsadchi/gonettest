function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function calcTotalKm(obj) {
    return (obj.distZero + obj.distUpto2 + obj.distAbove2) / 1000;
}

function validateAdminStats(stats) {
    const fields = ['total', 'zero', 'upto2', 'above2', 'distZero', 'distUpto2', 'distAbove2'];
    for (const [regName, reg] of Object.entries(stats)) {
        const regSum = Object.fromEntries(fields.map(f => [f, 0]));
        for (const [rayonName, rayon] of Object.entries(reg.rayons)) {
            const rayonSum = Object.fromEntries(fields.map(f => [f, 0]));
            for (const h of Object.values(rayon.hromady)) {
                for (const f of fields) rayonSum[f] += h[f];
            }
            for (const f of fields) {
                regSum[f] += rayon[f];
                if (rayonSum[f] !== rayon[f]) {
                    console.warn(`Mismatch in rayon ${rayonName} of region ${regName} for ${f}: ${rayon[f]} vs ${rayonSum[f]}`);
                    rayon.mismatch = true;
                }
            }
        }
        for (const f of fields) {
            if (regSum[f] !== reg[f]) {
                console.warn(`Mismatch in region ${regName} for ${f}: ${reg[f]} vs ${regSum[f]}`);
                reg.mismatch = true;
            }
        }
    }
}

function updateAdminStats() {
    const container = document.getElementById('adminStatsContent');
    if (!container) return;
    if (typeof currentLang === 'undefined') return;
    const unit = currentLang === 'uk' ? 'км' : 'km';

    const stats = {};
    for (const rec of speedData) {
        if (!rec.region) continue;
        if (!stats[rec.region]) {
            stats[rec.region] = {
                total: 0, zero: 0, upto2: 0, above2: 0,
                distZero: 0, distUpto2: 0, distAbove2: 0,
                rayons: {}
            };
        }
        const reg = stats[rec.region];
        const dist = rec.distance || 0;
        accumulateSpeedStats(reg, rec.speed, dist);

        if (rec.rayon) {
            if (!reg.rayons[rec.rayon]) {
                reg.rayons[rec.rayon] = {
                    total: 0, zero: 0, upto2: 0, above2: 0,
                    distZero: 0, distUpto2: 0, distAbove2: 0,
                    hromady: {}
                };
            }
            const rayon = reg.rayons[rec.rayon];
            accumulateSpeedStats(rayon, rec.speed, dist);

            if (rec.hromada) {
                if (!rayon.hromady[rec.hromada]) {
                    rayon.hromady[rec.hromada] = {
                        total: 0, zero: 0, upto2: 0, above2: 0,
                        distZero: 0, distUpto2: 0, distAbove2: 0
                    };
                }
                const h = rayon.hromady[rec.hromada];
                accumulateSpeedStats(h, rec.speed, dist);
            }
        }
    }

    validateAdminStats(stats);
    const regions = Object.keys(stats).sort();
    if (regions.length === 0) {
        container.innerHTML = `<div class="info-row"><span>${t('noData', 'Немає даних')}</span><span></span></div>`;
        return;
    }

    const baseIndent = 30;
    const calcIndent = depth => baseIndent * depth;

    const statsRows = (obj, depth) => {
        const indent = calcIndent(depth);
        const totalKm = calcTotalKm(obj).toFixed(1);
        return (
            countRows(obj, depth) +
            `<div class="info-row" style="--indent:${indent}px"><span>${t('distanceKmLabel', 'Відстань:')}</span><span>${totalKm} ${unit}</span></div>` +
            distRows(obj, depth)
        );
    };

    let id = 0;
    const rows = [];
    const pct = (v, tot) => (tot ? Math.round((v / tot) * 100) : 0);
    const countRows = (obj, depth) => {
        const indent = calcIndent(depth);
        const sum = obj.zero + obj.upto2 + obj.above2;
        if (obj.total !== sum) {
            console.warn(`Mismatch in total count: ${obj.total} vs ${sum}`);
        }
        return (
            `<div class="info-row" style="--indent:${indent}px"><span>${t('recordsLabel', 'Записів')}:</span><span>${obj.total}</span></div>` +
            `<div class="info-row" style="--indent:${indent}px"><span>${t('zeroSpeedLabel', '0 Мбіт/с (% від загальної протяжності):')}</span><span>${obj.zero} (${pct(obj.zero, obj.total)}%)</span></div>` +
            `<div class="info-row" style="--indent:${indent}px"><span>${t('upTo2SpeedLabel', 'До 2 Мбіт/с (% від загальної протяжності):')}</span><span>${obj.upto2} (${pct(obj.upto2, obj.total)}%)</span></div>` +
            `<div class="info-row" style="--indent:${indent}px"><span>${t('above2SpeedLabel', 'Більше 2 Мбіт/с (% від загальної протяжності):')}</span><span>${obj.above2} (${pct(obj.above2, obj.total)}%)</span></div>`
        );
    };
    const distRows = (obj, depth) => {
        const indent = calcIndent(depth);
        return (
            `<div class="info-row" style="--indent:${indent}px"><span>${t('zeroSpeedLabel2', '0 Мбіт/с:')}</span><span>${(obj.distZero / 1000).toFixed(1)} ${unit}</span></div>` +
            `<div class="info-row" style="--indent:${indent}px"><span>${t('upTo2SpeedLabel2', 'До 2 Мбіт/с:')}</span><span>${(obj.distUpto2 / 1000).toFixed(1)} ${unit}</span></div>` +
            `<div class="info-row" style="--indent:${indent}px"><span>${t('above2SpeedLabel2', 'Більше 2 Мбіт/с:')}</span><span>${(obj.distAbove2 / 1000).toFixed(1)} ${unit}</span></div>`
        );
    };
    
    for (const regName of regions) {
        const reg = stats[regName];
        const regId = `reg-${id++}`;
        rows.push(
            `<div class="info-row admin-toggle${reg.mismatch ? ' status-warning' : ''}" data-target="${regId}"><span><i data-lucide="plus"></i> ${escapeHtml(regName)}</span><span>${reg.total} (${calcTotalKm(reg).toFixed(1)} ${unit})</span></div>`
        );
        let sub = statsRows(reg, 1);
        const rayons = Object.keys(reg.rayons).sort();
        for (const rayonName of rayons) {
            const rayon = reg.rayons[rayonName];
            const rayonId = `rayon-${id++}`;
            sub +=
                `<div class="info-row admin-toggle${rayon.mismatch ? ' status-warning' : ''}" data-target="${rayonId}" style="--indent:${calcIndent(1)}px"><span><i data-lucide="plus"></i> ${escapeHtml(rayonName)}</span><span>${rayon.total} (${calcTotalKm(rayon).toFixed(1)} ${unit})</span></div>` +
                `<div id="${rayonId}" class="admin-content hidden">` +
                statsRows(rayon, 2);
            const hroms = Object.keys(rayon.hromady).sort();
            for (const hName of hroms) {
                const h = rayon.hromady[hName];
                sub +=
                    `<div class="info-row" style="--indent:${calcIndent(3)}px"><span>${escapeHtml(hName)}</span><span>${h.total} (${calcTotalKm(h).toFixed(1)} ${unit})</span></div>` +
                    statsRows(h, 3);
            }
            sub += `</div>`;
        }
        rows.push(`<div id="${regId}" class="admin-content hidden">${sub}</div>`);
    }

    container.innerHTML = rows.join('');
    if (window.lucide) lucide.createIcons({ strokeWidth: 1.2, class: 'h-4 w-4' });

    setupToggle(container, '.admin-toggle');
}
