"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const processor_1 = require("./core/processor");
function readConfig() {
    const basePath = path.join(__dirname, '..');
    const configPath = path.join(basePath, 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const templatesDir = path.join(basePath, 'src', 'templates');
    const applyStylesStep = config.processingSteps.find(step => step.id === 'applyStyles');
    if (applyStylesStep && applyStylesStep.params && applyStylesStep.params.templateFileName) {
        const templatePath = path.join(templatesDir, applyStylesStep.params.templateFileName);
        applyStylesStep.params.templateContent = fs.readFileSync(templatePath, 'utf-8');
    }
    return config;
}
let mainWindow;
let selectedFilePaths = [];
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1000,
        height: 700,
        resizable: false,
        maximizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    mainWindow.setMenu(null);
    mainWindow.loadFile('index.html');
}
function askToRetry(window, fileName) {
    return new Promise(resolve => {
        window.webContents.send('update-status', `\n  ОШИБКА: Файл ${fileName} заблокирован. Пожалуйста, закройте его и нажмите ENTER в консоли.`);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', key => {
            if (key.toString() === '\u0003') { // Ctrl+C
                process.exit();
            }
            process.stdin.setRawMode(false);
            process.stdin.pause();
            resolve();
        });
    });
}
// === IPC ОБРАБОТЧИКИ ===
electron_1.ipcMain.handle('get-config', () => {
    return readConfig();
});
electron_1.ipcMain.handle('select-files', async () => {
    if (!mainWindow)
        return;
    const { filePaths } = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Word Documents', extensions: ['docx'] }]
    });
    if (filePaths && filePaths.length > 0) {
        selectedFilePaths = filePaths;
        mainWindow.webContents.send('update-status', `Выбрано файлов: ${filePaths.length}`);
        filePaths.forEach(p => mainWindow.webContents.send('update-status', `  - ${path.basename(p)}`));
    }
    else {
        selectedFilePaths = [];
        mainWindow.webContents.send('update-status', 'Выбор файлов отменен.');
    }
});
electron_1.ipcMain.handle('start-processing', async (event, enabledStepIds) => {
    if (selectedFilePaths.length === 0) {
        mainWindow?.webContents.send('update-status', 'Файлы не выбраны. Сначала выберите файлы.');
        return;
    }
    const config = readConfig();
    const stepsToRun = config.processingSteps.filter(step => enabledStepIds.includes(step.id));
    mainWindow?.webContents.send('update-status', '\nНачинаю обработку файлов...');
    for (let i = 0; i < selectedFilePaths.length; i++) {
        const filePath = selectedFilePaths[i];
        const fileName = path.basename(filePath);
        let report;
        let retryCount = 0;
        const MAX_RETRIES = 3;
        do {
            try {
                report = await (0, processor_1.processDocxFile)(filePath, stepsToRun);
                report.logMessages.forEach(msg => mainWindow?.webContents.send('update-status', msg));
                if (!report.success && report.error && report.error.includes('EBUSY')) {
                    if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        await askToRetry(mainWindow, report.fileName);
                    }
                    else {
                        mainWindow?.webContents.send('update-status', `\n  ОШИБКА: Превышено количество попыток для файла ${report.fileName}. Пропускаю.`);
                        report.success = false;
                        break;
                    }
                }
                else if (!report.success) {
                    break;
                }
                else {
                    break;
                }
            }
            catch (procError) {
                const msg = procError instanceof Error ? procError.message : String(procError);
                mainWindow?.webContents.send('update-status', `\n  КРИТИЧЕСКАЯ ОШИБКА при запуске процессора для ${fileName}: ${msg}`);
                report = { fileName: fileName, success: false, logMessages: [], error: msg };
                break;
            }
        } while (!report.success);
        if (!report.success) {
            mainWindow?.webContents.send('update-status', `  Обработка файла ${fileName} завершена с ошибками.`);
        }
    }
    mainWindow?.webContents.send('update-status', '\nВСЯ ОБРАБОТКА ЗАВЕРШЕНА.');
});
// === ЖИЗНЕННЫЙ ЦИКЛ ПРИЛОЖЕНИЯ ===
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
