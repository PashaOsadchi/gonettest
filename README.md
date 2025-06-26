# gonettest

A minimal browser-based network speed test. The app runs entirely in the browser and can also be installed as a progressive web app (PWA).

## Features

- Streaming download speed measurement with realtime charting
- Optional upload test and ping statistics
- Ability to select a test server
4. The JavaScript uses ES6 modules. No build step is required; modern browsers load `js/main.js` automatically.

- GPS tracking with map view and recorded route
- Sound and voice alerts
- Works offline and can be installed as a PWA
- Language selection
- Export data to **CSV** or **KML**, download an **HTML** map, or save the speed chart as an image

## Running locally

1. Clone this repository.
2. Start a simple static server from the project directory:
   ```bash
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000/index.html` in your browser.
4. The JavaScript uses ES6 modules and runs directly in modern browsers.
5. (Optional) Install the app when prompted to enable offline use.

## Usage

Click **"Почати тест"** to start the measurement. Use the controls to pause or resume the test and to toggle settings. The results table and map are updated as data is collected.

Use the **Завантажити CSV**, **Завантажити KML**, or **Завантажити HTML** buttons to export your data. The **Завантажити графік швидкості** button saves the current chart image.

Visit [https://www.gonettest.com](https://www.gonettest.com) for the hosted version.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
