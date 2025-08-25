import { app, BrowserWindow, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface ProcessingStep {
    id: string;
    name: string;
    description: string;
    targetFile: string;
    enabled: boolean;
    params: any;
}
export interface Config {
    processingSteps: ProcessingStep[];
}

function readConfig(): Config {
    const basePath = app.isPackaged ? app.getAppPath() : path.join(__dirname, '..');
    const configPath = path.join(basePath, 'config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    mainWindow.setMenu(null);
    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    ipcMain.handle('get-config', (): Config => {
        return readConfig();
    });
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});