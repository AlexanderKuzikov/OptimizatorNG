import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

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

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const BOM = '\uFEFF';

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
        const stepsByFile: { [key: string]: ProcessingStep[] } = {};

        for (const step of enabledSteps) {
            if (!stepsByFile[step.targetFile]) {
                stepsByFile[step.targetFile] = [];
            }
            stepsByFile[step.targetFile].push(step);
        }

        for (const targetFile in stepsByFile) {
            let hasBom = false;
            let hasXmlDeclaration = false; // Добавлено для отслеживания наличия XML-декларации

            const entry = zip.getEntry(targetFile);
            if (!entry) {
                report.logMessages.push(`  Предупреждение: Целевой файл "${targetFile}" не найден в архиве.`);
                continue;
            }
            let currentContent = entry.getData().toString('utf-8');

            // --- ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ 1: Убираем BOM в самом начале ---
            if (currentContent.charCodeAt(0) === 0xFEFF) {
                hasBom = true; // Запоминаем, что BOM был
                currentContent = currentContent.substring(1);
            }
            // -------------------------------------------------------------

            // --- Добавлен костыль: сохраняем оригинальный открывающий тег <w:document ...> ---
            let originalDocumentOpeningTag = '';
            // Проверяем наличие XML-декларации
            if (currentContent.startsWith('<?xml')) {
                hasXmlDeclaration = true;
            }

            const documentOpeningTagMatch = currentContent.match(/^(<\?xml[^>]*\?>\s*)?(<w:document[^>]*>)/);
            if (documentOpeningTagMatch && targetFile === 'word/document.xml') {
                // Если XML-декларация присутствует, она будет в group 1 (если есть), сам тег <w:document> в group 2
                originalDocumentOpeningTag = documentOpeningTagMatch[2]; // Группа 2 захватывает <w:document...>
            }
            // --------------------------------------------------------------------------

            for (const step of stepsByFile[targetFile]) {
                const processFunction = functionMap[step.id];

                if (!processFunction) {
                    report.logMessages.push(`  Предупреждение: Функция для шага "${step.id}" не найдена.`);
                    continue;
                }

                const result = processFunction(currentContent, step.params);

                // Если шаг сообщил об изменениях, но XML остался прежним - это ошибка
                // Если шаг сообщил об 0 изменениях, но XML изменился - это ошибка
                // В обоих случаях доверяем счетчику changes
                if (result.changes === 0 && result.xml !== currentContent) {
                     report.logMessages.push(`  ПРЕДУПРЕЖДЕНИЕ: Шаг "${step.name}" сообщил об 0 изменениях, но изменил XML. Откат шага.`);
                } else if (result.changes > 0 && result.xml === currentContent) {
                     report.logMessages.push(`  ПРЕДУПРЕЖДЕНИЕ: Шаг "${step.name}" сообщил об ${result.changes} изменениях, но XML остался прежним. Откат шага.`);
                } else {
                    currentContent = result.xml;
                }

                let stepReportMessage = `Шаг "${step.name}": `;
                if (['applyStyles', 'setPageMargins'].includes(step.id)) {
                    stepReportMessage += result.changes > 0 ? `Выполнен.` : `Пропущен (изменений не требовалось).`;
                } else {
                    stepReportMessage += result.changes > 0 ? `Произведено замен: ${result.changes}.` : `Изменений не найдено.`;
                }
                report.logMessages.push(stepReportMessage);
            }

            // --- ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ 2: Восстанавливаем XML-декларацию и BOM перед записью ---
            // --- Добавлен костыль: Заменяем открывающий тег <w:document ...> на наш сохраненный ---
            if (targetFile === 'word/document.xml' && originalDocumentOpeningTag) {
                // Ищем текущий открывающий тег <w:document ...> в обработанном контенте
                const currentDocumentOpeningTagRegex = /<w:document[^>]*>/;
                // Заменяем его на сохраненный, чтобы восстановить все xmlns: атрибуты
                currentContent = currentContent.replace(currentDocumentOpeningTagRegex, originalDocumentOpeningTag);
            }
            
            // Убеждаемся, что XML начинается с декларации, если она была или требуется по умолчанию
            if (hasXmlDeclaration && !currentContent.startsWith('<?xml')) {
                currentContent = XML_DECLARATION + currentContent;
            } else if (!hasXmlDeclaration && !currentContent.startsWith('<?xml') && targetFile.endsWith('.xml')) {
                // Если декларации не было, но файл XML, добавляем дефолтную
                currentContent = XML_DECLARATION + currentContent;
            }

            // Возвращаем BOM, если он был в исходном файле
            if (hasBom && !currentContent.startsWith(BOM)) { // Проверяем, что BOM еще не добавлен
                currentContent = BOM + currentContent;
            }
            // --------------------------------------------------------------------

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