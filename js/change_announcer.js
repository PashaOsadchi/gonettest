// js/change_announcer.js

function createChangeAnnouncer(settingsKey, getMessage, keyList) {
    let lastState = {};
    keyList.forEach(key => {
        lastState[key] = null;
    });

    return function(info) {
        if (!info) {
            lastState = {};
            keyList.forEach(key => {
                lastState[key] = null;
            });
            return;
        }

        const currentState = {};
        keyList.forEach(key => {
            currentState[key] = info[key] ?? null;
        });

        const hasChanged = keyList.some(key => lastState[key] !== currentState[key]);

        if (settings[settingsKey] && hasChanged) {
            const message = getMessage(currentState, info);
            if (message) {
                speak(message.trim());
            }
        }

        lastState = currentState;
    };
}

