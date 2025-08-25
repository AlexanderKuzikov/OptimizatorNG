import type { IElectronAPI } from './preload';

declare global {
    interface Window {
        api: IElectronAPI;
    }
}

// --- ЛОКАЛЬНЫЕ ИНТЕРФЕЙСЫ ---
interface ProcessingStep {
    id: string;
    name: string;
    targetFile: string;
    enabled: boolean;
}

interface Config {
    processingSteps: ProcessingStep[];
}

// --- DOM Элементы ---
// Получаем ссылки на элементы после их гарантированного существования
let stepsContainer: HTMLElement;
let statusLog: HTMLElement;
let selectFilesButton: HTMLButtonElement;
let startProcessingButton: HTMLButtonElement;
let logContent = '';


// --- Функции ---

function log(message: string) {
    if (statusLog) {
        logContent += message + '\n';
        statusLog.innerHTML = logContent;
        statusLog.scrollTop = statusLog.scrollHeight;
    }
}

/**
 * Асинхронная функция для получения конфига и отрисовки UI.
 */
async function renderUI() {
    try {
        const config: Config = await window.api.getConfig();
        
        const groups: { [key: string]: ProcessingStep[] } = config.processingSteps.reduce(
            (acc: { [key:string]: ProcessingStep[] }, step: ProcessingStep) => {
                const groupName = step.targetFile || 'general';
                if (!acc[groupName]) acc[groupName] = [];
                acc[groupName].push(step);
                return acc;
            }, {});

        stepsContainer.innerHTML = ''; // Очищаем надпись "Загрузка..."
        for (const groupName in groups) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'step-group';
            groupDiv.innerHTML = `<h2>${groupName}</h2>`;

            groups[groupName].forEach((step: ProcessingStep) => {
                const label = document.createElement('label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = step.id;
                checkbox.checked = step.enabled;
                label.appendChild(checkbox);
                label.append(` ${step.name}`);
                groupDiv.appendChild(label);
            });
            stepsContainer.appendChild(groupDiv);
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        stepsContainer.innerHTML = `<p style="color: red;">Ошибка загрузки конфигурации: ${message}</p>`;
        log(`[ERROR] Ошибка загрузки конфига: ${message}`);
    }
}

/**
 * Главная функция, которая запускается после загрузки DOM.
 */
function main() {
    // Получаем ссылки на элементы DOM
    stepsContainer = document.getElementById('processing-steps') as HTMLElement;
    statusLog = document.getElementById('status-log') as HTMLElement;
    selectFilesButton = document.getElementById('select-files-button') as HTMLButtonElement;
    startProcessingButton = document.getElementById('start-processing-button') as HTMLButtonElement;

    // Проверяем, что все элементы найдены
    if (!stepsContainer || !statusLog || !selectFilesButton || !startProcessingButton) {
        console.error("Критическая ошибка: не найдены все необходимые элементы DOM. Проверьте index.html.");
        document.body.innerHTML = `<h1 style="color: red;">Критическая ошибка: структура HTML нарушена.</h1>`;
        return;
    }

    // Обработчик для кнопки "Выбрать файлы"
    selectFilesButton.addEventListener('click', async () => {
        logContent = ''; // Очищаем лог при новом выборе
        log('Запрос на выбор файлов...');
        // Вызываем IPC метод, который теперь будет только выбирать файлы, но не запускать обработку
        await window.api.selectFiles(); 
    });

    // Обработчик для кнопки "Запустить обработку"
    startProcessingButton.addEventListener('click', async () => {
        logContent = ''; // Очищаем лог
        log('Запуск обработки...');
        // Собираем ID включенных шагов
        const checkboxes = document.querySelectorAll('#processing-steps input[type="checkbox"]');
        const enabledSteps = Array.from(checkboxes)
            .filter(i => (i as HTMLInputElement).checked)
            .map(i => i.id);
        
        // Вызываем IPC метод для запуска обработки
        await window.api.startProcessing(enabledSteps);
    });

    // Подписываемся на сообщения о статусе от main процесса
    window.api.onUpdateStatus((_event, message: string) => {
        log(message);
    });

    // Первичная отрисовка UI
    renderUI();
}

// --- ТОЧКА ВХОДА ---
window.addEventListener('DOMContentLoaded', main);