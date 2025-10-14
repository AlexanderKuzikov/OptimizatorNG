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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDocxFile = processDocxFile;
const path = __importStar(require("path"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const applyStyles_1 = require("./steps/applyStyles");
const setPageMargins_1 = require("./steps/setPageMargins");
const removeStyles_1 = require("./steps/removeStyles");
const removeParagraphSpacing_1 = require("./steps/removeParagraphSpacing");
const removeIndentation_1 = require("./steps/removeIndentation");
const removeFonts_1 = require("./steps/removeFonts");
const removeFontSize_1 = require("./steps/removeFontSize");
const removeDuplicateSpaces_1 = require("./steps/removeDuplicateSpaces");
const removeTrailingSpaces_1 = require("./steps/removeTrailingSpaces");
const removeTextColor_1 = require("./steps/removeTextColor");
const cleanupDocumentStructure_1 = require("./steps/cleanupDocumentStructure");
const assimilateSpaceRuns_1 = require("./steps/assimilateSpaceRuns");
const mergeConsecutiveRuns_1 = require("./steps/mergeConsecutiveRuns");
const mergeInstructionTextRuns_1 = require("./steps/mergeInstructionTextRuns");
const cleanupParaProps_1 = require("./steps/cleanupParaProps");
const replaceSpaceWithNbspAfterNumbering_1 = require("./steps/replaceSpaceWithNbspAfterNumbering");
const functionMap = {
    applyStyles: applyStyles_1.applyStyles,
    setPageMargins: setPageMargins_1.setPageMargins,
    removeStyles: removeStyles_1.removeStyles,
    removeParagraphSpacing: removeParagraphSpacing_1.removeParagraphSpacing,
    removeIndentation: removeIndentation_1.removeIndentation,
    removeFonts: removeFonts_1.removeFonts,
    removeFontSize: removeFontSize_1.removeFontSize,
    removeDuplicateSpaces: removeDuplicateSpaces_1.removeDuplicateSpaces,
    removeTrailingSpaces: removeTrailingSpaces_1.removeTrailingSpaces,
    removeTextColor: removeTextColor_1.removeTextColor,
    cleanupDocumentStructure: cleanupDocumentStructure_1.cleanupDocumentStructure,
    assimilateSpaceRuns: assimilateSpaceRuns_1.assimilateSpaceRuns,
    mergeConsecutiveRuns: mergeConsecutiveRuns_1.mergeConsecutiveRuns,
    mergeInstructionTextRuns: mergeInstructionTextRuns_1.mergeInstructionTextRuns,
    cleanupParaProps: cleanupParaProps_1.cleanupParaProps,
    replaceSpaceWithNbspAfterNumbering: replaceSpaceWithNbspAfterNumbering_1.replaceSpaceWithNbspAfterNumbering
};
const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const BOM = '\uFEFF';
async function processDocxFile(filePath, enabledSteps) {
    const originalFileName = path.basename(filePath);
    const report = {
        fileName: originalFileName,
        success: false,
        logMessages: [`--- Обрабатываю файл: ${originalFileName} ---`]
    };
    try {
        const zip = new adm_zip_1.default(filePath);
        const stepsByFile = {};
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
                }
                else if (result.changes > 0 && result.xml === currentContent) {
                    report.logMessages.push(`  ПРЕДУПРЕЖДЕНИЕ: Шаг "${step.name}" сообщил об ${result.changes} изменениях, но XML остался прежним. Откат шага.`);
                }
                else {
                    currentContent = result.xml;
                }
                let stepReportMessage = `Шаг "${step.name}": `;
                if (['applyStyles', 'setPageMargins'].includes(step.id)) {
                    stepReportMessage += result.changes > 0 ? `Выполнен.` : `Пропущен (изменений не требовалось).`;
                }
                else {
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
            }
            else if (!hasXmlDeclaration && !currentContent.startsWith('<?xml') && targetFile.endsWith('.xml')) {
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        report.logMessages.push(`  КРИТИЧЕСКАЯ ОШИБКА: ${errorMessage}`);
        report.error = errorMessage;
        report.success = false;
    }
    return report;
}
