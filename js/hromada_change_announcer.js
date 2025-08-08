// js/hromada_change_announcer.js

const announceAdminChange = createChangeAnnouncer(
    'voiceHromadaChange',
    state => {
        const region = state.region ?? '';
        const rayon = state.rayon ?? '';
        const hromada = state.hromada ?? '';
        return `Вас вітає ${hromada} ${rayon} район ${region} область`;
    },
    ['region', 'rayon', 'hromada']
);

