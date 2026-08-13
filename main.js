const { app, BrowserWindow } = require('electron');
const path = require('path');
const server = require('./server/src/index.js'); // Import our modified express server

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Gallery",
  });

  mainWindow.removeMenu(); // Remove default electron menu for cleaner look

  // Check if we are in development mode
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // In development, the Vite server runs on port 5173
    // We start the express server on port 5000 as usual
    await server.startServer(5000);
    
    // Wait a brief moment for Vite to be ready (handled by wait-on in package.json usually)
    mainWindow.loadURL('http://localhost:5173');
    
    // Open DevTools
    mainWindow.webContents.openDevTools();
  } else {
    // In production, start the express server on a dynamic free port (0)
    // Express will also serve the static client files
    const instance = await server.startServer(0);
    const assignedPort = instance.address().port;
    
    // Load the express server which is serving the React app
    mainWindow.loadURL(`http://localhost:${assignedPort}`);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set writable data directory for sqlite database (solves read-only error in ASAR)
  process.env.APP_DATA_DIR = path.join(app.getPath('userData'), 'server-data');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    server.stopServer();
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
