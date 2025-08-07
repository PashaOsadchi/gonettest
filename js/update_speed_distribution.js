function updateSpeedDistribution() {
    let total = 0,
        zero = 0,
        upTo2 = 0,
        above2 = 0;
    for (const rec of speedData) {
        const speed = rec.speed;
        if (typeof speed !== "number" || speed < 0 || Number.isNaN(speed)) {
            continue;
        }
        total++;
        if (speed === 0) {
            zero++;
        } else if (speed > 0 && speed <= 2) {
            upTo2++;
        } else if (speed > 2) {
            above2++;
        }
    }

    const set = (id, count) => {
        const el = document.getElementById(id);
        if (el) {
            const percent = total ? Math.round((count / total) * 100) : 0;
            el.textContent = `${count} (${percent}%)`;
        }
    };

    set("zeroSpeedCount", zero);
    set("upto2SpeedCount", upTo2);
    set("above2SpeedCount", above2);
}

