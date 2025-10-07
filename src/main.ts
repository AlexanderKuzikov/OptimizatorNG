import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { processDocxFile, ProcessorReport } from './core/processor';

// --- ИНТЕРФЕЙСЫ ---
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
    const basePath = path.join(__dirname, '..');
    const configPath = path.join(basePath, 'config.json');
    const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    const templatesDir = path.join(basePath, 'src', 'templates');
    
    const applyStylesStep = config.processingSteps.find(step => step.id === 'applyStyles');
    if (applyStylesStep && applyStylesStep.params && applyStylesStep.params.templateFileName) {
        const templatePath = path.join(templatesDir, applyStylesStep.params.templateFileName);
        applyStylesStep.params.templateContent = fs.readFileSync(templatePath, 'utf-8');
    }

    return config;
}

let mainWindow: BrowserWindow;
let selectedFilePaths: string[] = [];

function createWindow() {
    mainWindow = new BrowserWindow({
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

function askToRetry(window: BrowserWindow, fileName: string): Promise<void> {
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
ipcMain.handle('get-config', (): Config => {
    return readConfig();
});

ipcMain.handle('select-files', async (): Promise<void> => {
    if (!mainWindow) return;
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Word Documents', extensions: ['docx'] }]
    });
    if (filePaths && filePaths.length > 0) {
        selectedFilePaths = filePaths;
        mainWindow.webContents.send('update-status', `Выбрано файлов: ${filePaths.length}`);
        filePaths.forEach(p => mainWindow.webContents.send('update-status', `  - ${path.basename(p)}`));
    } else {
        selectedFilePaths = [];
        mainWindow.webContents.send('update-status', 'Выбор файлов отменен.');
    }
});

ipcMain.handle('start-processing', async (event, enabledStepIds: string[]): Promise<void> => {
    if (selectedFilePaths.length === 0) {
        mainWindow?.webContents.send('update-status', 'Файлы не выбраны. Сначала выберите файлы.');
        return;
    }

    const config: Config = readConfig();
    const stepsToRun: ProcessingStep[] = config.processingSteps.filter(step => enabledStepIds.includes(step.id));

    mainWindow?.webContents.send('update-status', '\nНачинаю обработку файлов...');

    for (let i = 0; i < selectedFilePaths.length; i++) {
        const filePath = selectedFilePaths[i];
        const fileName = path.basename(filePath);
        let report: ProcessorReport | undefined;
        let retryCount = 0;
        const MAX_RETRIES = 3;

        do {
            try {
                report = await processDocxFile(filePath, stepsToRun);
                report.logMessages.forEach(msg => mainWindow?.webContents.send('update-status', msg));
                if (!report.success && report.error && report.error.includes('EBUSY')) {
                    if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        await askToRetry(mainWindow, report.fileName);
                    } else {
                        mainWindow?.webContents.send('update-status', `\n  ОШИБКА: Превышено количество попыток для файла ${report.fileName}. Пропускаю.`);
                        report.success = false;
                        break;
                    }
                } else if (!report.success) {
                    break;
                } else {
                    break;
                }
            } catch (procError: unknown) {
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
app.whenReady().then(createWindow);

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