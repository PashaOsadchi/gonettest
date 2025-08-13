function downloadKML() {
    if (!ensureSpeedData()) return;

    const baseFileName = buildBaseFileName(speedData, operator);

    let kmlContent =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<kml xmlns="http://www.opengis.net/kml/2.2">\n' +
        '<Document>\n' +
        `<name>${baseFileName}</name>\n` +
        `<Style id="red"><IconStyle><Icon><href>${ICON_RED}</href></Icon></IconStyle></Style>\n` +
        `<Style id="yellow"><IconStyle><Icon><href>${ICON_YELLOW}</href></Icon></IconStyle></Style>\n` +
        `<Style id="green"><IconStyle><Icon><href>${ICON_GREEN}</href></Icon></IconStyle></Style>\n`;

    speedData.forEach((record, idx) => {
        if (record.latitude == null || record.longitude == null) return;

        if (Number.isNaN(Number(record.downloadedDelta))) {
            console.warn(
                'Skipping record with non-numeric downloadedDelta',
                record
            );
            return;
        }

        const altitude =
            record.altitude != null ? record.altitude.toFixed(1) : (0).toFixed(1);

        const ts =
            record.fullTimestamp instanceof Date
                ? record.fullTimestamp
                : new Date(record.fullTimestamp);
        const { dateStr, timeStr } = formatTimestamp(ts);

        const description =
            `Часова мітка (мс): ${ts.getTime()}<br>` +
            `Дата: ${dateStr}<br>` +
            `Час: ${timeStr}<br>` +
            `Оператор: ${operator}<br>` +
            `Швидкість (Мбіт/с): ${record.speed.toFixed(2)}<br>` +
            `Завантажено від попереднього запису (МБ): ${record.downloadedDelta.toFixed(2)}<br>` +
            `Тривалість (с): ${record.elapsed ?? ''}<br>` +
            `Широта: ${record.latitude}<br>` +
            `Довгота: ${record.longitude}<br>` +
            `Висота (м): ${altitude}<br>` +
            `Область: ${record.region}<br>` +
            `Район: ${record.rayon}<br>` +
            `Громада: ${record.hromada}<br>` +
            `Номер дороги: ${record.roadRef ?? ''}<br>` +
            `GPS Швидкість (км/год): ${
                record.gpsSpeed != null ? record.gpsSpeed.toFixed(1) : ''
            }<br>` +
            `Відстань (м): ${
                record.distance != null ? record.distance.toFixed(1) : ''
            }<br>` +
            `Точність (м): ${
                record.accuracy != null ? record.accuracy.toFixed(1) : ''
            }<br>` +
            `Напрямок (°): ${
                record.heading != null ? record.heading.toFixed(1) : ''
            }`;

        let style = '#green';
        if (record.speed === 0) {
            style = '#red';
        } else if (record.speed > 0 && record.speed <= 2) {
            style = '#yellow';
        }

        kmlContent +=
            `<Placemark>` +
            `<name>${idx + 1}</name>` +
            `<styleUrl>${style}</styleUrl>` +
            `<description><![CDATA[${description}]]></description>` +
            `<Point><coordinates>${record.longitude},${record.latitude},${altitude}</coordinates></Point>` +
            `</Placemark>\n`;
    });

    kmlContent += '</Document>\n</kml>';

    const blob = new Blob([kmlContent], {
        type: 'application/vnd.google-earth.kml+xml',
    });
    saveBlob(blob, `${baseFileName}.kml`);
    showNotification(t('kmlDownloaded', 'KML файл завантажено!'));
}
