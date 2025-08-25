import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { removeStyles } from './core/steps/removeStyles';
import { setPageMargins } from './core/steps/setPageMargins';
import { removeParagraphSpacing } from './core/steps/removeParagraphSpacing';
import { removeIndentation } from './core/steps/removeIndentation';
import { applyStyles } from './core/steps/applyStyles';
import { removeFonts } from './core/steps/removeFonts';
import { removeFontSize } from './core/steps/removeFontSize';
import { removeTrailingSpaces } from './core/steps/removeTrailingSpaces';
import { removeDuplicateSpaces } from './core/steps/removeDuplicateSpaces';
import { removeTextColor } from './core/steps/removeTextColor';

// === 1. Определяем "паспорта" для наших данных ===
interface ProcessingStep {
    id: string;
    name: string;
    description: string;
    targetFile: string;
    enabled: boolean;
    params: any;
}

interface Config {
    processingSteps: ProcessingStep[];
}

interface StepResult {
    xml: string;
    changes: number;
}

// === 2. Определяем наши рабочие папки ===
const IN_DIRECTORY = path.join(__dirname, '..', 'IN');
const OUT_DIRECTORY = path.join(__dirname, '..', 'OUT');

// === 3. Загружаем и парсим конфиг ===
const config: Config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf-8'));
const enabledSteps = config.processingSteps.filter(step => step.enabled);

// === 4. Создаем карту функций ===
const functionMap: { [key: string]: (xml: string, params: any) => StepResult } = {
    applyStyles,
    setPageMargins,
    removeStyles,
    removeParagraphSpacing,
    removeIndentation,
    removeFonts,
    removeFontSize,
    removeTrailingSpaces,
    removeDuplicateSpaces,
    removeTextColor,
};

function askToRetry(): Promise<void> {
    console.log('Пожалуйста, закройте файл и нажмите ENTER, чтобы повторить попытку...');
    return new Promise(resolve => {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', key => {
            if (key.toString() === '\u0003') process.exit();
            process.stdin.setRawMode(false);
            process.stdin.pause();
            resolve();
        });
    });
}

// === 5. Главная функция ===
async function main() {
    console.log('Начинаю обработку...');
    if (!fs.existsSync(OUT_DIRECTORY)) fs.mkdirSync(OUT_DIRECTORY);

    const files = fs.readdirSync(IN_DIRECTORY);

    for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        if (path.extname(fileName) !== '.docx') continue;

        console.log(`\n--- Обрабатываю файл: ${fileName} ---`);
        
        try {
            const filePath = path.join(IN_DIRECTORY, fileName);
            const zip = new AdmZip(filePath);
            
            const fileContents: { [key: string]: string } = {};
            const uniqueTargetFiles = [...new Set(enabledSteps.map(step => step.targetFile))];
            
            for (const targetFile of uniqueTargetFiles) {
                const entry = zip.getEntry(targetFile);
                fileContents[targetFile] = entry ? entry.getData().toString('utf-8') : '';
            }

            for (const step of enabledSteps) {
                const processFunction = functionMap[step.id];
                if (!processFunction) {
                    console.warn(`  Предупреждение: Функция для шага "${step.id}" не найдена.`);
                    continue;
                }

                let currentContent = fileContents[step.targetFile];
                const result = processFunction(currentContent, step.params);
                fileContents[step.targetFile] = result.xml;
                
                // НОВАЯ ЛОГИКА ОТЧЕТОВ
                let report = `Шаг "${step.name}": `;
                if (step.id === 'applyStyles' || step.id === 'setPageMargins') {
                    report += result.changes > 0 ? `Выполнен.` : `Пропущен (изменений не требовалось).`;
                } else {
                    report += result.changes > 0 ? `Произведено замен: ${result.changes}.` : `Изменений не найдено.`;
                }
                console.log(report);
            }

            for (const targetFile in fileContents) {
                zip.updateFile(targetFile, Buffer.from(fileContents[targetFile], 'utf-8'));
            }
            
            const outPath = path.join(OUT_DIRECTORY, fileName);
            zip.writeZip(outPath);
            console.log(`  Успешно сохранено в: ${outPath}`);

        } catch (error: any) {
            if (error.code === 'EBUSY') {
                console.error(`\n  ОШИБКА: Не удалось сохранить файл ${fileName}. Он заблокирован другой программой.`);
                await askToRetry();
                i--; 
                continue;
            } else {
                console.error(`\n  КРИТИЧЕСКАЯ ОШИБКА при обработке файла ${fileName}:`, error.message);
                console.log('  Пропускаю этот файл и перехожу к следующему.');
                continue;
            }
        }
    }

    console.log('\nОбработка завершена.');
}

// === 6. Запускаем! ===
main();