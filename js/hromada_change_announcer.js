// js/hromada_change_announcer.js
let lastAdminUnit = { region: null, rayon: null, hromada: null };

function announceAdminChange(info) {
    if (!info) {
        lastAdminUnit = { region: null, rayon: null, hromada: null };
        return;
    }

    if (!info.region || !info.rayon || !info.hromada) {
        console.warn('announceAdminChange: incomplete info', info);
    }

    if (settings.voiceHromadaChange) {
        if (
            !lastAdminUnit.hromada ||
            lastAdminUnit.hromada !== info.hromada ||
            lastAdminUnit.rayon !== info.rayon ||
            lastAdminUnit.region !== info.region
        ) {
            const region = info.region ?? '';
            const rayon = info.rayon ?? '';
            const hromada = info.hromada ?? '';
            const message = `Вас вітає ${hromada} ${rayon} ${region}`;
            speak(message.trim());
        }
    }

    lastAdminUnit = {
        region: info.region,
        rayon: info.rayon,
        hromada: info.hromada
    };
}
