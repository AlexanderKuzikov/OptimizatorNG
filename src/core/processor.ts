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
// ++ ДОБАВЛЕН НОВЫЙ ИМПОРТ ++
import { mergeConsecutiveRuns } from './steps/mergeConsecutiveRuns';
import { replaceSpaceWithNbspAfterNumbering } from './steps/replaceSpaceWithNbspAfterNumbering';

// --- ИНТЕРФЕЙСЫ ---
interface StepResult { xml: string; changes: number; }

interface ProcessingStep {
    id: string;
    name: string;
    description: string;
    targetFile: string;
    enabled: boolean;
    params: any;
}

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
    // ++ ДОБАВЛЕНА НОВАЯ ФУНКЦИЯ ++
    mergeConsecutiveRuns,
    replaceSpaceWithNbspAfterNumbering
};

// === ГЛАВНАЯ ФУНКЦИЯ ПРОЦЕССОРА ===
export async function processDocxFile(
    filePath: string,
    enabledSteps: ProcessingStep[],
    outDirectory: string
): Promise<ProcessorReport> {
    const fileName = path.basename(filePath);
    const report: ProcessorReport = {
        fileName: fileName,
        success: false,
        logMessages: [`--- Обрабатываю файл: ${fileName} ---`]
    };

    try {
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
                report.logMessages.push(`  Предупреждение: Функция для шага "${step.id}" не найдена.`);
                continue;
            }

            let currentContent = fileContents[step.targetFile];
            const result = processFunction(currentContent, step.params);
            fileContents[step.targetFile] = result.xml;

            let stepReportMessage = `Шаг "${step.name}": `;
            if (['applyStyles', 'setPageMargins'].includes(step.id)) {
                stepReportMessage += result.changes > 0 ? `Выполнен.` : `Пропущен (изменений не требовалось).`;
            } else {
                stepReportMessage += result.changes > 0 ? `Произведено замен: ${result.changes}.` : `Изменений не найдено.`;
            }
            report.logMessages.push(stepReportMessage);
        }

        for (const targetFile in fileContents) {
            zip.updateFile(targetFile, Buffer.from(fileContents[targetFile], 'utf-8'));
        }

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