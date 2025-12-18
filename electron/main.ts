import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchVideoInfo as getVideoInfo, validateUrl, startDownload, deleteJob } from './services/downloader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    console.log('[Main] Creating window...');
    console.log('[Main] app.getAppPath():', app.getAppPath());
    console.log('[Main] __dirname:', __dirname);
    console.log('[Main] app.isPackaged:', app.isPackaged);

    const preloadPath = path.join(app.getAppPath(), 'electron', 'preload.cjs');
    console.log('[Main] preloadPath:', preloadPath);

    mainWindow = new BrowserWindow({
        width: 1100,
        height: 800,
        backgroundColor: '#000000',
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: !app.isPackaged, // Allow local file loading in production
        },
        title: 'Mono_Pixel YouTube Downloader',
    });

    mainWindow.setMenuBarVisibility(false);

    if (!app.isPackaged) {
        console.log('[Main] Loading dev URL: http://localhost:3000');
        mainWindow.loadURL('http://localhost:3000');
    } else {
        // Use app.getAppPath() for consistent ASAR-friendly path
        const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
        console.log('[Main] Loading production file:', indexPath);
        mainWindow.loadFile(indexPath).catch(err => {
            console.error('[Main] Failed to load index.html:', err);
        });
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('analyze-url', async (event, url) => {
    try {
        const validation = validateUrl(url);
        if (!validation.valid) return { success: false, error: 'Invalid YouTube URL' };
        const info = await getVideoInfo(url);
        return { success: true, data: info };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('start-download', async (event, { url, type, format, quality }) => {
    try {
        const { filePath } = await dialog.showSaveDialog(mainWindow!, {
            title: 'Select Download Location',
            defaultPath: path.join(app.getPath('downloads'), `youtube_download.${format.toLowerCase()}`),
        });
        if (!filePath) return { success: false, error: 'Download cancelled' };

        const jobId = await startDownload({ url, type, format, quality }, filePath, (update) => {
            mainWindow?.webContents.send(`download-progress-${jobId}`, update);
        });
        return { success: true, jobId };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('delete-job', async (event, jobId) => {
    return deleteJob(jobId);
});
