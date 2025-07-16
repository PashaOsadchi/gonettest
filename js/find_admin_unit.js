// Global variable to hold the GeoJSON data for hromady (communities)
let hromadyData = null;
let hromadyDataPromise = null;

// Fetches hromady GeoJSON once and caches it in hromadyData.
// Returns a promise that resolves when the data is loaded.
function loadHromadyData() {
    if (!hromadyDataPromise) {
        hromadyDataPromise = fetch('data/ukraine_hromady.geojson')
            .then(r => r.json())
            .then(data => {
                hromadyData = data;
                return hromadyData;
            })
            .catch(err => {
                console.error('Failed to load hromady data', err);
                throw err;
            });
    }
    return hromadyDataPromise;
}

/**
 * Checks if a point is inside a polygon using the ray-casting algorithm.
 * @param {number[]} point - The point to check, as [longitude, latitude].
 * @param {number[][]} polygon - An array of vertices representing the polygon.
 * @returns {boolean} - True if the point is inside the polygon, false otherwise.
 */
function isPointInPolygon(point, polygon) {
    const x = point[0];
    const y = point[1];
    let isInside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0];
        const yi = polygon[i][1];
        const xj = polygon[j][0];
        const yj = polygon[j][1];

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) {
            isInside = !isInside;
        }
    }
    return isInside;
}

/**
 * Finds the administrative units (oblast, raion, hromada) for a given set of coordinates.
 * It iterates through the hromady GeoJSON data, as it's the most granular and contains
 * all the necessary information.
 * @param {number} lon - The longitude of the point.
 * @param {number} lat - The latitude of the point.
 * @returns {object|null} - An object with region, rayon, and hromada properties, or null if not found.
 */
function find_admin_unit(lon, lat) {
    if (!hromadyData) {
        console.error("GeoJSON data not loaded yet.");
        return null;
    }

    const point = [lon, lat];

    for (const feature of hromadyData.features) {
        const geometry = feature.geometry;
        const properties = feature.properties;

        if (geometry.type === 'Polygon') {
            // A Polygon is an array of rings. The first is the outer boundary.
            const polygonCoordinates = geometry.coordinates[0];
            if (isPointInPolygon(point, polygonCoordinates)) {
                // For simplicity, we are not checking for holes in polygons.
                // This is generally sufficient for this kind of application.
                return properties;
            }
        } else if (geometry.type === 'MultiPolygon') {
            // A MultiPolygon is an array of Polygons.
            for (const polygon of geometry.coordinates) {
                const polygonCoordinates = polygon[0];
                if (isPointInPolygon(point, polygonCoordinates)) {
                    // Not checking for holes here either for simplicity.
                    return properties;
                }
            }
        }
    }

    return null; // Point not found in any hromada
}