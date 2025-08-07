function replaceSpacesWithUnderscore(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/\s+/g, '_')
        .replace(/[^\w-]/g, '');
}
