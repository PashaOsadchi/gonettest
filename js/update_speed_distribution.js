function updateSpeedDistribution() {
    const total = speedData.length;
    let zero = 0,
        upTo2 = 0;
    for (const rec of speedData) {
        if (rec.speed === 0) {
            zero++;
        } else if (rec.speed > 0 && rec.speed <= 2) {
            upTo2++;
        }
    }
    const above2 = total - zero - upTo2;

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

