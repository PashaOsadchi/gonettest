// js/config.js
const TARGET = 100 * 1024 * 1024;
const MAX_CONSECUTIVE_ERRORS = 1000;
const RECONNECT_TIMEOUT = 1000;
const BIG_FETCH_TIMEOUT = 30000;
const NOTIFICATION_DURATION = 3000;
const BEEP_FREQUENCY = 800;
const BEEP_DURATION = 200;
const SPEECH_RATE = 0.8;
const GPS_TIMEOUT = 5000;
const GPS_MAX_AGE = 1000;
const MAX_GPS_ACCURACY = 100;
// Maximum distance (m) between consecutive GPS points to consider them valid
const MAX_POINT_DISTANCE = 100;
const DEFAULT_FETCH_TIMEOUT = 1000;
const STREAM_READ_TIMEOUT = 500000;
const UI_UPDATE_INTERVAL = 1000;
const DEFAULT_SAVE_INTERVAL = 1;
const RECONNECT_RETRY_INTERVAL = 500;
const RUN_LOOP_PAUSE = 500;
const ORIENTATION_DELAY = 100;
const MAX_DATA_POINTS = 60;
const serverUrl = `https://speed.cloudflare.com/__down?bytes=${TARGET}`;
const STORAGE_KEY = 'speedData';

const IPINFO_URL = 'https://ipinfo.io/json';
const IPINFO_TOKEN = 'e2a0c701aef96b';
const NETWORK_CHECK_URL = 'https://www.google.com/generate_204';

const MAP_DEFAULT_CENTER = [48.3794, 31.1656];
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const MARKERCLUSTER_CSS_URL = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
const MARKERCLUSTER_DEFAULT_CSS_URL = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
const MARKERCLUSTER_JS_URL = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';

const MAP_FALLBACK_CENTER = [50.45, 30.52];

const ICON_RED = 'https://maps.google.com/mapfiles/kml/paddle/red-circle.png';
const ICON_YELLOW = 'https://maps.google.com/mapfiles/kml/paddle/ylw-circle.png';
const ICON_GREEN = 'https://maps.google.com/mapfiles/kml/paddle/grn-circle.png';

const HROMADY_GEOJSON = 'data/ukraine_hromady.geojson';

const ROAD_FILES = {
    international: 'data/international_road_ua_m.geojson',
    national: 'data/national_road_ua_h.geojson',
    regional: 'data/regional_road_ua_p.geojson',
    territorial: 'data/territorial_road_ua_t.geojson',
};

const SPEED_CAMERA_FILE = 'data/speed_camera_coordinates.json';

// Zoom level at which clustering is disabled on the main map
const DISABLE_CLUSTER_ZOOM = 18;

const DEFAULT_DIRECTION_LABELS = {
    uk: ["Пн", "ПнСх", "Сх", "ПдСх", "Пд", "ПдЗх", "Зх", "ПнЗх"],
    en: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
};

window.currentLang = window.currentLang || localStorage.getItem('lang') || 'uk';
let currentLang = window.currentLang;

// Глобальні змінні
let testActive = false;
let totalBytes = 0,
    prevBytes = 0,
    startTime = 0,
    updateInterval = null;
let consecutiveErrors = 0;
let isConnected = true;
let isFullscreen = false;
let testInProgress = false;
let pendingRun = false;
let activeDownloadController = null;
let isDownloading = false;

// Дані та налаштування
let speedData = [];
let dataInterval = null;
let lastSavedBytes = 0;
let currentSpeedMbps = 0;
let currentGPSData = {
    latitude: null,
    longitude: null,
    altitude: null,
    speed: null,
    accuracy: null,
    heading: null,
};
let lastSavedGPSData = {
    latitude: null,
    longitude: null,
};
let gpsWatchId = null;
let totalDistance = 0;

// Налаштування
let settings = {
    saveInterval: DEFAULT_SAVE_INTERVAL,
    gpsDistance: 10,
    speedThreshold: 5,
    soundAlerts: false,
    voiceAlerts: false,
    voiceHromadaChange: false,
    voiceRoadChange: false,
    showHromady: false,
    showInternationalRoads: false,
    showNationalRoads: false,
    showRegionalRoads: false,
    showTerritorialRoads: false,
    showSpeedCameras: false,
};

// Графік
let speedChart = null;
let chartData = [];
let maxDataPoints = MAX_DATA_POINTS; // Показуємо останні 60 точок

// Карта
let map = null;
let mapMarkers = [];
let mapInitialized = false;
let hromadyLayer = null;
let internationalRoadLayer = null;
let nationalRoadLayer = null;
let regionalRoadLayer = null;
let territorialRoadLayer = null;
let speedCameraLayer = null;
let redCluster = null;
let yellowCluster = null;
let greenCluster = null;

// Статистика
let speedStats = {
    min: Infinity,
    max: 0,
    sum: 0,
    count: 0,
};

let operator = '';

const operators = {
    'AS21497 PrJSC VF UKRAINE': 'Vodafone',
    'AS15895 "Kyivstar" PJSC': 'Kyivstar',
    'AS34058 Limited Liability Company "lifecell"': 'Lifecell'
};

export { HROMADY_GEOJSON, ROAD_FILES, DISABLE_CLUSTER_ZOOM, SPEED_CAMERA_FILE };

Object.assign(globalThis, {
    TARGET,
    MAX_CONSECUTIVE_ERRORS,
    RECONNECT_TIMEOUT,
    BIG_FETCH_TIMEOUT,
    NOTIFICATION_DURATION,
    BEEP_FREQUENCY,
    BEEP_DURATION,
    SPEECH_RATE,
    GPS_TIMEOUT,
    GPS_MAX_AGE,
    MAX_GPS_ACCURACY,
    MAX_POINT_DISTANCE,
    DEFAULT_FETCH_TIMEOUT,
    STREAM_READ_TIMEOUT,
    UI_UPDATE_INTERVAL,
    DEFAULT_SAVE_INTERVAL,
    RECONNECT_RETRY_INTERVAL,
    RUN_LOOP_PAUSE,
    ORIENTATION_DELAY,
    MAX_DATA_POINTS,
    serverUrl,
    STORAGE_KEY,
    IPINFO_URL,
    IPINFO_TOKEN,
    NETWORK_CHECK_URL,
    MAP_DEFAULT_CENTER,
    OSM_TILE_URL,
    LEAFLET_CSS_URL,
    LEAFLET_JS_URL,
    MARKERCLUSTER_CSS_URL,
    MARKERCLUSTER_DEFAULT_CSS_URL,
    MARKERCLUSTER_JS_URL,
    MAP_FALLBACK_CENTER,
    ICON_RED,
    ICON_YELLOW,
    ICON_GREEN,
    HROMADY_GEOJSON,
    ROAD_FILES,
    SPEED_CAMERA_FILE,
    DISABLE_CLUSTER_ZOOM,
    DEFAULT_DIRECTION_LABELS,
    currentLang,
    testActive,
    totalBytes,
    prevBytes,
    startTime,
    updateInterval,
    consecutiveErrors,
    isConnected,
    isFullscreen,
    testInProgress,
    pendingRun,
    activeDownloadController,
    isDownloading,
    speedData,
    dataInterval,
    lastSavedBytes,
    currentSpeedMbps,
    currentGPSData,
    lastSavedGPSData,
    gpsWatchId,
    totalDistance,
    settings,
    speedChart,
    chartData,
    maxDataPoints,
    map,
    mapMarkers,
    mapInitialized,
    hromadyLayer,
    internationalRoadLayer,
    nationalRoadLayer,
    regionalRoadLayer,
    territorialRoadLayer,
    speedCameraLayer,
    redCluster,
    yellowCluster,
    greenCluster,
    speedStats,
    operator,
    operators,
});
