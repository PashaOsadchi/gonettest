function replaceSpacesWithUnderscore(str) {
    return str
        .replace(/\s+/g, '_')
        .replace(/[^\w-]/g, '');
}
