import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
// import { JSDOM } from 'jsdom'; // JSDOM больше не нужен для parseSectionProperties

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
import { convertTwoColumnTablesToTabbedParagraphs } from './steps/convertTwoColumnTablesToTabbedParagraphs';
import { applySignatureFormatting } from './steps/applySignatureFormatting';
import { setTableWidthForOtherTables } from './steps/setTableWidthForOtherTables';
import { normalizeProshuWord } from './steps/normalizeProshuWord'; // НОВЫЙ ИМПОРТ

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
    replaceSpaceWithNbspAfterNumbering,
    convertTwoColumnTablesToTabbedParagraphs,
    applySignatureFormatting,
    setTableWidthForOtherTables,
    normalizeProshuWord // НОВАЯ ФУНКЦИЯ ДОБАВЛЕНА
};

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const BOM = '\uFEFF';
// const WORD_NAMESPACE = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'; // Больше не нужен здесь

/**
 * Читает default-sectPr.xml и извлекает параметры страницы с помощью RegExp.
 * @param templatePath Путь к файлу default-sectPr.xml.
 * @returns {width: number, leftMargin: number, rightMargin: number} Извлеченные параметры.
 */
function parseSectionProperties(templatePath: string): { width: number, leftMargin: number, rightMargin: number } {
    const sectPrContent = fs.readFileSync(templatePath, 'utf-8');

    const widthMatch = sectPrContent.match(/w:pgSz w:w="(\d+)"/);
    const leftMarginMatch = sectPrContent.match(/w:pgMar[^>]*w:left="(\d+)"/);
    const rightMarginMatch = sectPrContent.match(/w:pgMar[^>]*w:right="(\d+)"/);

    const width = widthMatch ? parseInt(widthMatch[1], 10) : 0;
    const leftMargin = leftMarginMatch ? parseInt(leftMarginMatch[1], 10) : 0;
    const rightMargin = rightMarginMatch ? parseInt(rightMarginMatch[1], 10) : 0;

    if (width === 0 || leftMargin === 0 || rightMargin === 0) {
        throw new Error(`Не удалось извлечь все необходимые параметры ширины и полей из ${templatePath}. Проверьте содержимое файла.`);
    }

    return { width, leftMargin, rightMargin };
}

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

        // === Чтение и парсинг default-sectPr.xml для printableWidth ===
        // Предполагается, что src находится на один уровень выше dist (если main.js в dist/)
        const basePath = path.join(__dirname, '..', '..'); // ИЗМЕНЕНО: на два уровня выше, если main.js в dist/
        const templatesDir = path.join(basePath, 'src', 'templates');
        const defaultSectPrPath = path.join(templatesDir, 'default-sectPr.xml');
        let printableWidth = 0;

        // console.log(`[DEBUG] Полный путь к default-sectPr.xml: ${defaultSectPrPath}`); // УДАЛЕНО: DEBUG

        try {
            if (!fs.existsSync(defaultSectPrPath)) {
                throw new Error(`Файл не найден: ${defaultSectPrPath}`);
            }
            const { width, leftMargin, rightMargin } = parseSectionProperties(defaultSectPrPath);
            printableWidth = width - leftMargin - rightMargin;
            report.logMessages.push(`  Рассчитана печатная ширина страницы: ${printableWidth} твипов.`);
            // console.log(`[DEBUG] Извлечено: width=${width}, leftMargin=${leftMargin}, rightMargin=${rightMargin}, printableWidth=${printableWidth}`); // УДАЛЕНО: DEBUG
        } catch (error: any) {
            report.logMessages.push(`  КРИТИЧЕСКАЯ ОШИБКА: Не удалось рассчитать печатную ширину страницы из ${defaultSectPrPath}. ${error.message}. Ширина таблиц не будет установлена.`);
            // console.error(`[DEBUG] Ошибка при парсинге default-sectPr.xml: ${error.message}`); // УДАЛЕНО: DEBUG
            printableWidth = 0;
            report.success = false;
        }
        // =================================================================

        for (const step of enabledSteps) {
            // Добавляем printableWidth к параметрам шага setTableWidthForOtherTables
            if (step.id === 'setTableWidthForOtherTables') {
                step.params = { ...step.params, printableWidth };
            }

            if (!stepsByFile[step.targetFile]) {
                stepsByFile[step.targetFile] = [];
            }
            stepsByFile[step.targetFile].push(step);
        }

        for (const targetFile in stepsByFile) {
            let hasBom = false;
            let hasXmlDeclaration = false;

            const entry = zip.getEntry(targetFile);
            if (!entry) {
                report.logMessages.push(`  Предупреждение: Целевой файл "${targetFile}" не найден в архиве.`);
                continue;
            }
            let currentContent = entry.getData().toString('utf-8');

            // --- Убираем BOM в самом начале ---
            if (currentContent.charCodeAt(0) === 0xFEFF) {
                hasBom = true;
                currentContent = currentContent.substring(1);
            }

            // --- Сохраняем оригинальный открывающий тег <w:document ...> и наличие XML-декларации ---
            let originalDocumentOpeningTag = '';
            if (currentContent.startsWith('<?xml')) {
                hasXmlDeclaration = true;
            }

            const documentOpeningTagMatch = currentContent.match(/^(<\?xml[^>]*\?>\s*)?(<w:document[^>]*>)/);
            if (documentOpeningTagMatch && targetFile === 'word/document.xml') {
                originalDocumentOpeningTag = documentOpeningTagMatch[2];
            }
            // --------------------------------------------------------------------------

            for (const step of stepsByFile[targetFile]) {
                const processFunction = functionMap[step.id];

                if (!processFunction) {
                    report.logMessages.push(`  Предупреждение: Функция для шага "${step.id}" не найдена.`);
                    continue;
                }

                const result = processFunction(currentContent, step.params);

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

            // --- Восстанавливаем XML-декларацию и BOM перед записью, а также тег <w:document ...> ---

            // Если это word/document.xml и у нас есть сохраненный тег, восстанавливаем его
            if (targetFile === 'word/document.xml' && originalDocumentOpeningTag) {
                const currentDocumentOpeningTagRegex = /<w:document[^>]*>/;
                currentContent = currentContent.replace(currentDocumentOpeningTagRegex, originalDocumentOpeningTag);
            }
            
            // Восстанавливаем XML-декларацию, если она была или требуется
            if (hasXmlDeclaration && !currentContent.startsWith('<?xml')) {
                currentContent = XML_DECLARATION + currentContent;
            } else if (!hasXmlDeclaration && !currentContent.startsWith('<?xml') && targetFile.endsWith('.xml')) {
                currentContent = XML_DECLARATION + currentContent;
            }

            // Восстанавливаем BOM, если он был в исходном файле
            if (hasBom && !currentContent.startsWith(BOM)) {
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