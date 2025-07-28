// js/hromada_change_announcer.js
let lastAdminUnit = { region: null, rayon: null, hromada: null };

function announceAdminChange(info) {
    if (!info) {
        lastAdminUnit = { region: null, rayon: null, hromada: null };
        return;
    }

    if (settings.voiceHromadaChange && settings.voiceAlerts && lastAdminUnit.hromada) {
        if (
            lastAdminUnit.hromada !== info.hromada ||
            lastAdminUnit.rayon !== info.rayon ||
            lastAdminUnit.region !== info.region
        ) {
            speak(`Вас вітає ${info.hromada} ${info.rayon} ${info.region}`);
        }
    }

    lastAdminUnit = {
        region: info.region,
        rayon: info.rayon,
        hromada: info.hromada
    };
}
