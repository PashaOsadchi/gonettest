function accumulateSpeedStats(target, speed, distance) {
    const dist = distance || 0;
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

