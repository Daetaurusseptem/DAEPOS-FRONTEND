const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  const indexPath = path.join(__dirname, 'dist/connor-pos-frontend/index.html');
  console.log('Index path:', indexPath); // Agrega un log para verificar la ruta
  win.loadFile(indexPath)
    .catch(err => {
      console.error('Failed to load the page', err);
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
