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

    if (settings.voiceRoadChange) {
        const isInitial =
            lastRoad.ref === null &&
            lastRoad.name === null &&
            lastRoad.network === null;
        const hasChanged =
            lastRoad.ref !== currentRef ||
            lastRoad.name !== currentName ||
            lastRoad.network !== currentNetwork;

        if (isInitial || hasChanged) {
            const refPart = currentRef ? `${currentRef}` : '';
            const namePart = currentName ? `${currentName}` : '';
            const networkPart = currentNetwork ? `${currentNetwork}` : '';
            const parts = [refPart, namePart, networkPart].filter(part => part);
            speak(['Ви виїхали на дорогу', ...parts].join(' '));
        }
    }

    lastRoad = { ref: currentRef, name: currentName, network: currentNetwork };
}
