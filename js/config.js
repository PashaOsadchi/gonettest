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
const MAX_GPS_ACCURACY = 10;
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

export const IPINFO_URL = 'https://ipinfo.io/json';
export const IPINFO_TOKEN = 'e2a0c701aef96b';

export const MAP_DEFAULT_CENTER = [48.3794, 31.1656];
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
export const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
export const MARKERCLUSTER_CSS_URL = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
export const MARKERCLUSTER_DEFAULT_CSS_URL = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
export const MARKERCLUSTER_JS_URL = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';

export const MAP_FALLBACK_CENTER = [50.45, 30.52];

const ICON_RED = 'https://maps.google.com/mapfiles/kml/paddle/red-circle.png';
const ICON_YELLOW = 'https://maps.google.com/mapfiles/kml/paddle/ylw-circle.png';
const ICON_GREEN = 'https://maps.google.com/mapfiles/kml/paddle/grn-circle.png';

// Zoom level at which clustering is disabled on the main map
export const DISABLE_CLUSTER_ZOOM = 18;

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
