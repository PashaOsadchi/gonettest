// js/road_change_announcer.js

const announceRoadChange = (function() {
    const announcer = createChangeAnnouncer(
        'voiceRoadChange',
        state => {
            const refPart = state.ref ? `${state.ref}` : '';
            const namePart = state.name ? `${state.name}` : '';
            const networkPart = state.network ? `${state.network}` : '';
            const parts = [refPart, namePart, networkPart].filter(part => part);
            if (parts.length === 0) {
                return null;
            }
            return ['Ви виїхали на дорогу', ...parts].join(' ');
        },
        ['ref', 'name', 'network']
    );

    return function(road) {
        if (!road) {
            announcer(null);
            return;
        }
        const info = {
            ref: road.ref || null,
            name: road.official_name || road['name:uk'] || road.name || null,
            network: road.network || null
        };
        announcer(info);
    };
})();

