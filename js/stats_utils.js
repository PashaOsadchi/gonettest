function accumulateSpeedStats(target, speed, distance) {
    if (!Number.isFinite(speed)) {
        if (typeof addLog === 'function') {
            addLog(`accumulateSpeedStats: invalid speed ${speed}`);
        }
        return;
    }

    let dist = 0;
    if (distance !== undefined) {
        if (!Number.isFinite(distance) || distance < 0) {
            if (typeof addLog === 'function') {
                addLog(`accumulateSpeedStats: invalid distance ${distance}`);
            }
        } else {
            dist = distance;
        }
    }

    target.total++;
    if (speed === 0) {
        target.zero++;
        target.distZero += dist;
    } else if (speed > 0 && speed <= 2) {
        target.upto2++;
        target.distUpto2 += dist;
    } else {
        target.above2++;
        target.distAbove2 += dist;
    }
}

