// js/road_change_announcer.js
let lastRoad = { ref: null, name: null, network: null };

function announceRoadChange(road) {
    if (!road) {
        lastRoad = { ref: null, name: null, network: null };
        return;
    }

    const currentRef = road.ref || null;
    const currentName = road.official_name || road['name:uk'] || road.name || null;
    const currentNetwork = road.network || null;

    if (settings.voiceRoadChange && settings.voiceAlerts) {
        if (
            !lastRoad.ref ||
            lastRoad.ref !== currentRef ||
            lastRoad.name !== currentName ||
            lastRoad.network !== currentNetwork
        ) {
            const refPart = currentRef ? `${currentRef}` : '';
            const namePart = currentName ? `${currentName}` : '';
            const networkPart = currentNetwork ? `${currentNetwork}` : '';
            speak(`Ви виїхали на дорогу ${refPart} ${namePart} ${networkPart}`.trim());
        }
    }

    lastRoad = { ref: currentRef, name: currentName, network: currentNetwork };
}
