# gonettest

A minimal browser-based network speed test. The app runs entirely in the browser and can also be installed as a progressive web app (PWA).

## Features

- Streaming download speed measurement with realtime charting
- Optional upload test and ping statistics
- Ability to select a test server
- GPS tracking with map view and recorded route
- Sound and voice alerts (community or road announcements automatically enable voice alerts)
- Works offline and can be installed as a PWA
- Stores measurements locally using IndexedDB
- Language selection
- Export data to **CSV** or **KML**, download an **HTML** map, or save the speed chart as an image

## Running locally

1. Clone this repository.
2. Start a simple static server from the project directory:
   ```bash
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000/index.html` in your browser.
4. (Optional) Install the app when prompted to enable offline use.

## Usage

Click **"Почати тест"** to start the measurement. Use the controls to pause or resume the test and to toggle settings. The results table and map are updated as data is collected.

Use the **Завантажити CSV**, **Завантажити KML**, or **Завантажити HTML** buttons to export your data. The **Завантажити графік швидкості** button saves the current chart image.

Visit [https://www.gonettest.com](https://www.gonettest.com) for the hosted version.

## Configuration

Application behaviour can be adjusted by editing constants in [`js/config.js`](js/config.js).
The `MAX_POINT_DISTANCE` constant defines the maximum distance in meters allowed
between successive GPS points. Distances larger than this value are ignored to
filter out GPS glitches. The default value is `100`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
