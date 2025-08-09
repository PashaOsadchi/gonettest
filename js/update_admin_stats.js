function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function updateAdminStats() {
    const container = document.getElementById('adminStatsContent');
    if (!container) return;

    const stats = {};
    for (const rec of speedData) {
        if (!rec.region) continue;
        if (!stats[rec.region]) {
            stats[rec.region] = {
                total: 0, zero: 0, upto2: 0, above2: 0,
                distZero: 0, distUpto2: 0, distAbove2: 0,
                raions: {}
            };
        }
        const reg = stats[rec.region];
        const dist = rec.distance || 0;
        accumulateSpeedStats(reg, rec.speed, dist);

        if (rec.rayon) {
            if (!reg.raions[rec.rayon]) {
                reg.raions[rec.rayon] = {
                    total: 0, zero: 0, upto2: 0, above2: 0,
                    distZero: 0, distUpto2: 0, distAbove2: 0,
                    hromady: {}
                };
            }
            const ray = reg.raions[rec.rayon];
            accumulateSpeedStats(ray, rec.speed, dist);

            if (rec.hromada) {
                if (!ray.hromady[rec.hromada]) {
                    ray.hromady[rec.hromada] = {
                        total: 0, zero: 0, upto2: 0, above2: 0,
                        distZero: 0, distUpto2: 0, distAbove2: 0
                    };
                }
                const h = ray.hromady[rec.hromada];
                accumulateSpeedStats(h, rec.speed, dist);
            }
        }
    }

    const regions = Object.keys(stats).sort();
    if (regions.length === 0) {
        container.innerHTML = `<div class="info-row"><span>${t('noData', 'Немає даних')}</span><span></span></div>`;
        return;
    }

    const totalKm = (
            (obj.distZero + obj.distUpto2 + obj.distAbove2) /
            1000
        ).toFixed(1);

    const statsRows = (obj, indent, totalKm) => {
        return (
            countRows(obj, indent) +
            `<div class="info-row" style="--indent:${indent}px"><span>${t('distanceKmLabel', 'Відстань')}</span><span>${totalKm} ${unit}</span></div>` +
            distRows(obj, indent)
        );
    };

    let id = 0;
    const rows = [];
    const pct = (v, tot) => (tot ? Math.round((v / tot) * 100) : 0);
    const countRows = (obj, indent) =>
        `<div class="info-row" style="--indent:${indent}px"><span>${t('zeroSpeedLabel', '0 Мбіт/с:')}</span><span>${obj.zero} (${pct(obj.zero, obj.total)}%)</span></div>` +
        `<div class="info-row" style="--indent:${indent}px"><span>${t('upTo2SpeedLabel', 'До 2 Мбіт/с:')}</span><span>${obj.upto2} (${pct(obj.upto2, obj.total)}%)</span></div>` +
        `<div class="info-row" style="--indent:${indent}px"><span>${t('above2SpeedLabel', 'Більше 2 Мбіт/с:')}</span><span>${obj.above2} (${pct(obj.above2, obj.total)}%)</span></div>`;
    const distRows = (obj, indent) => {
        const unit = currentLang === 'uk' ? 'км' : 'km';
        return (
            `<div class="info-row" style="--indent:${indent}px"><span>${t('zeroSpeedLabel', '0 Мбіт/с:')}</span><span>${(obj.distZero / 1000).toFixed(1)} ${unit}</span></div>` +
            `<div class="info-row" style="--indent:${indent}px"><span>${t('upTo2SpeedLabel', 'До 2 Мбіт/с:')}</span><span>${(obj.distUpto2 / 1000).toFixed(1)} ${unit}</span></div>` +
            `<div class="info-row" style="--indent:${indent}px"><span>${t('above2SpeedLabel', 'Більше 2 Мбіт/с:')}</span><span>${(obj.distAbove2 / 1000).toFixed(1)} ${unit}</span></div>`
        );
    };
    

    for (const regName of regions) {
        const reg = stats[regName];
        const regId = `reg-${id++}`;
        rows.push(
            `<div class="info-row admin-toggle" data-target="${regId}"><span><i data-lucide="plus"></i> ${escapeHtml(regName)}</span><span>${reg.total} (${totalKm} ${unit})</span></div>`
        );
        let sub = statsRows(reg, 30);
        const raions = Object.keys(reg.raions).sort();
        for (const rayName of raions) {
            const ray = reg.raions[rayName];
            const rayId = `ray-${id++}`;
            sub +=
                `<div class="info-row admin-toggle" data-target="${rayId}" style="--indent:30px"><span><i data-lucide="plus"></i> ${escapeHtml(rayName)}</span><span>${ray.total}</span></div>` +
                `<div id="${rayId}" class="admin-content hidden" style="padding-left:30px">` +
                statsRows(ray, 30);
            const hroms = Object.keys(ray.hromady).sort();
            for (const hName of hroms) {
                const h = ray.hromady[hName];
                sub +=
                    `<div class="info-row" style="--indent:60px"><span>${escapeHtml(hName)}</span><span>${h.total}</span></div>` +
                    statsRows(h, 60);
            }
            sub += `</div>`;
        }
        rows.push(`<div id="${regId}" class="admin-content hidden">${sub}</div>`);
    }

    container.innerHTML = rows.join('');
    if (window.lucide) lucide.createIcons({ strokeWidth: 1.2, class: 'h-4 w-4' });

    setupToggle(container, '.admin-toggle');
}
