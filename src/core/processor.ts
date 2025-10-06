import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

// ... (все импорты остаются теми же)
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
import { assimilateSpaceRuns } from './steps/assimilateSpaceRuns';
import { mergeConsecutiveRuns } from './steps/mergeConsecutiveRuns';
import { mergeInstructionTextRuns } from './steps/mergeInstructionTextRuns';
import { cleanupParaProps } from './steps/cleanupParaProps';
import { replaceSpaceWithNbspAfterNumbering } from './steps/replaceSpaceWithNbspAfterNumbering';


// ... (интерфейсы и functionMap остаются теми же)
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
    assimilateSpaceRuns,
    mergeConsecutiveRuns,
    mergeInstructionTextRuns,
    cleanupParaProps,
    replaceSpaceWithNbspAfterNumbering
};


// === ГЛАВНАЯ ФУНКЦИЯ ПРОЦЕССОРА ===
export async function processDocxFile(
    filePath: string,
    enabledSteps: ProcessingStep[]
): Promise<ProcessorReport> {
    const originalFileName = path.basename(filePath);
    const report: ProcessorReport = {
        fileName: originalFileName,
        success: false,
        logMessages: [`--- Обрабатываю файл: ${originalFileName} ---`]
    };

    try {
        const zip = new AdmZip(filePath);

        // Группируем шаги по целевому файлу, чтобы читать и писать каждый файл только один раз за конвейер.
        const stepsByFile: { [key: string]: ProcessingStep[] } = {};
        for (const step of enabledSteps) {
            if (!stepsByFile[step.targetFile]) {
                stepsByFile[step.targetFile] = [];
            }
            stepsByFile[step.targetFile].push(step);
        }

        // Обрабатываем каждый целевой файл отдельно
        for (const targetFile in stepsByFile) {
            const entry = zip.getEntry(targetFile);
            if (!entry) {
                report.logMessages.push(`  Предупреждение: Целевой файл "${targetFile}" не найден в архиве.`);
                continue;
            }
            
            let currentContent = entry.getData().toString('utf-8');
            
            // Запускаем конвейер для этого файла
            for (const step of stepsByFile[targetFile]) {
                const processFunction = functionMap[step.id];
                if (!processFunction) {
                    report.logMessages.push(`  Предупреждение: Функция для шага "${step.id}" не найдена.`);
                    continue;
                }
                
                const result = processFunction(currentContent, step.params);
                currentContent = result.xml; // Обновляем контент для следующего шага в конвейере

                // Логируем результат шага
                let stepReportMessage = `Шаг "${step.name}": `;
                if (['applyStyles', 'setPageMargins'].includes(step.id)) {
                    stepReportMessage += result.changes > 0 ? `Выполнен.` : `Пропущен (изменений не требовалось).`;
                } else {
                    stepReportMessage += result.changes > 0 ? `Произведено замен: ${result.changes}.` : `Изменений не найдено.`;
                }
                report.logMessages.push(stepReportMessage);
            }
            
            // После всех шагов для данного файла, обновляем его в zip-архиве
            zip.updateFile(targetFile, Buffer.from(currentContent, 'utf-8'));
        }

        const originalDirectory = path.dirname(filePath);
        const newFileName = `cleared_${originalFileName}`;
        const outPath = path.join(originalDirectory, newFileName);
        
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