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
 * Checks if a point is inside a linear ring using the ray-casting algorithm.
 * @param {number[]} point - The point to check, as [longitude, latitude].
 * @param {number[][]} ring - An array of vertices representing a linear ring.
 * @returns {boolean} - True if the point is inside the ring, false otherwise.
 */
function isPointInPolygon(point, ring) {
    const x = point[0];
    const y = point[1];
    let isInside = false;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0];
        const yi = ring[i][1];
        const xj = ring[j][0];
        const yj = ring[j][1];

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) {
            isInside = !isInside;
        }
    }
    return isInside;
}

/**
 * Determines if a point lies within a polygon that may contain holes.
 * The first ring defines the outer boundary and any subsequent rings are holes.
 * @param {number[]} point - The point to check, as [longitude, latitude].
 * @param {number[][][]} rings - Array of rings composing the polygon.
 * @returns {boolean} - True if the point is inside the outer ring and not within any hole.
 */
function isPointInPolygonWithHoles(point, rings) {
    const [outer, ...holes] = rings;
    if (!isPointInPolygon(point, outer)) {
        return false;
    }
    for (const hole of holes) {
        if (isPointInPolygon(point, hole)) {
            return false;
        }
    }
    return true;
}

/**
 * Finds the administrative units (oblast, raion, hromada) for a given set of coordinates.
 * It iterates through the hromady GeoJSON data, as it's the most granular and contains
 * all the necessary information.
 * @param {number} lon - The longitude of the point.
 * @param {number} lat - The latitude of the point.
 * @returns {Promise<object|null>} - An object with region, rayon, and hromada properties, or null if not found.
 */
async function find_admin_unit(lon, lat) {
    if (!hromadyData) {
        try {
            await loadHromadyData();
        } catch (e) {
            console.error("GeoJSON data not loaded yet.", e);
            return null;
        }
    }

    const point = [lon, lat];

    for (const feature of hromadyData.features) {
        const geometry = feature.geometry;
        const properties = feature.properties;

        if (geometry.type === 'Polygon') {
            if (isPointInPolygonWithHoles(point, geometry.coordinates)) {
                return properties;
            }
        } else if (geometry.type === 'MultiPolygon') {
            for (const polygon of geometry.coordinates) {
                if (isPointInPolygonWithHoles(point, polygon)) {
                    return properties;
                }
            }
        }
    }

    return null; // Point not found in any hromada
}

// ----- Road lookup functionality -----

const roadFiles = {
    international: 'data/international_road_ua_m.geojson',
    national: 'data/national_road_ua_h.geojson',
    regional: 'data/regional_road_ua_p.geojson',
    territorial: 'data/territorial_road_ua_t.geojson'
};

const roadData = {
    international: null,
    national: null,
    regional: null,
    territorial: null
};

const roadPromises = {};

function loadRoadData(type) {
    if (!roadPromises[type]) {
        roadPromises[type] = fetch(roadFiles[type])
            .then(r => r.json())
            .then(data => {
                roadData[type] = data;
                return data;
            })
            .catch(err => {
                console.error('Failed to load road data', err);
                throw err;
            });
    }
    return roadPromises[type];
}

function loadAllRoadData() {
    return Promise.all(Object.keys(roadFiles).map(loadRoadData));
}

function latLonToXY(lat, lon) {
    const rad = Math.PI / 180;
    const x = lon * 111320 * Math.cos(lat * rad);
    const y = lat * 110540;
    return [x, y];
}

function distanceToSegment(lat, lon, lat1, lon1, lat2, lon2) {
    const [x, y] = latLonToXY(lat, lon);
    const [x1, y1] = latLonToXY(lat1, lon1);
    const [x2, y2] = latLonToXY(lat2, lon2);
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = (A * C + B * D) / lenSq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function isPointNearLineString(lat, lon, coords, threshold) {
    for (let i = 0; i < coords.length - 1; i++) {
        const [lon1, lat1] = coords[i];
        const [lon2, lat2] = coords[i + 1];
        if (distanceToSegment(lat, lon, lat1, lon1, lat2, lon2) <= threshold) {
            return true;
        }
    }
    return false;
}

function isPointNearRoad(lat, lon, feature, threshold) {
    const geom = feature.geometry;
    if (!geom) return false;
    if (geom.type === 'LineString') {
        return isPointNearLineString(lat, lon, geom.coordinates, threshold);
    } else if (geom.type === 'MultiLineString') {
        for (const line of geom.coordinates) {
            if (isPointNearLineString(lat, lon, line, threshold)) return true;
        }
    }
    return false;
}

function find_road(lat, lon, threshold = 50) {
    const types = ['international', 'national', 'regional', 'territorial'];
    for (const type of types) {
        const data = roadData[type];
        if (!data) continue;
        for (const feature of data.features) {
            if (isPointNearRoad(lat, lon, feature, threshold)) {
                return feature.properties;
            }
        }
    }
    return null;
}