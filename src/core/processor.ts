import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

// Импортируем все наши атомарные функции
import { applyStyles } from './steps/applyStyles';
import { setPageMargins } from './steps/setPageMargins';
import { removeStyles } from './steps/removeStyles';
import { removeParagraphSpacing } from './steps/removeParagraphSpacing';
import { removeIndentation } from './steps/removeIndentation';
import { removeFonts } from './steps/removeFonts';
import { removeFontSize } from './steps/removeFontSize';
import { removeDuplicateSpaces } from './steps/removeDuplicateSpaces';
import { removeTrailingSpaces } from './steps/removeTrailingSpaces';
import { removeTextColor } from './steps/removeTextColor';
import { cleanupDocumentStructure } from './steps/cleanupDocumentStructure';
import { replaceSpaceWithNbspAfterNumbering } from './steps/replaceSpaceWithNbspAfterNumbering';

// --- ИНТЕРФЕЙСЫ ---

interface StepResult { xml: string; changes: number; }

// Интерфейс шага обработки (как в config.json), параметры расширены
interface ProcessingStep {
    id: string;
    name: string;
    description: string;
    targetFile: string;
    enabled: boolean;
    params: any;
}

// Отчет, который будет возвращать наш процессор
export interface ProcessorReport {
    fileName: string;
    success: boolean;
    logMessages: string[];
    error?: string;
}

// Карта функций для вызова атомов по ID
const functionMap: { [key: string]: (xml: string, params: any) => StepResult } = {
    applyStyles,
    setPageMargins,
    removeStyles,
    removeParagraphSpacing,
    removeIndentation,
    removeFonts,
    removeFontSize,
    removeDuplicateSpaces,
    removeTrailingSpaces,
    removeTextColor,
    cleanupDocumentStructure,
    replaceSpaceWithNbspAfterNumbering
};

// === ГЛАВНАЯ ФУНКЦИЯ ПРОЦЕССОРА ===

export async function processDocxFile(
    filePath: string,                  // Полный путь к исходному файлу
    enabledSteps: ProcessingStep[],    // Включенные шаги из config.json
    outDirectory: string               // Директория для сохранения результата
): Promise<ProcessorReport> {

    const fileName = path.basename(filePath);
    const report: ProcessorReport = {
        fileName: fileName,
        success: false,
        logMessages: [`--- Обрабатываю файл: ${fileName} ---`]
    };

    try {
        const zip = new AdmZip(filePath);

        // Загружаем все уникальные целевые файлы из DOCX в память
        const fileContents: { [key: string]: string } = {};
        const uniqueTargetFiles = [...new Set(enabledSteps.map(step => step.targetFile))];

        for (const targetFile of uniqueTargetFiles) {
            const entry = zip.getEntry(targetFile);
            fileContents[targetFile] = entry ? entry.getData().toString('utf-8') : '';
        }

        // --- Запускаем конвейер обработки по шагам ---

        for (const step of enabledSteps) {
            const processFunction = functionMap[step.id];

            if (!processFunction) {
                report.logMessages.push(`  Предупреждение: Функция для шага "${step.id}" не найдена.`);
                continue;
            }

            // Получаем текущее содержимое файла (или пустую строку, если его нет)
            let currentContent = fileContents[step.targetFile];

            // Выполняем обработку
            const result = processFunction(currentContent, step.params); 

            // Обновляем содержимое в памяти
            fileContents[step.targetFile] = result.xml;

            // Формируем отчет для этого шага
            let stepReportMessage = `Шаг "${step.name}": `;

            if (['applyStyles', 'setPageMargins'].includes(step.id)) {
                stepReportMessage += result.changes > 0 ? `Выполнен.` : `Пропущен (изменений не требовалось).`;
            } else {
                stepReportMessage += result.changes > 0 ? `Произведено замен: ${result.changes}.` : `Изменений не найдено.`;
            }

            report.logMessages.push(stepReportMessage);
        }

        // --- Сохраняем измененные файлы обратно в ZIP ---

        for (const targetFile in fileContents) {
            zip.updateFile(targetFile, Buffer.from(fileContents[targetFile], 'utf-8'));
        }

        // Сохраняем финальный ZIP-файл на диск
        const outPath = path.join(outDirectory, fileName);
        zip.writeZip(outPath);

        report.logMessages.push(`  Успешно сохранено в: ${outPath}`);
        report.success = true;

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        report.logMessages.push(`  КРИТИЧЕСКАЯ ОШИБКА: ${errorMessage}`);
        report.error = errorMessage;
        report.success = false;
    }

    return report;
}