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
// ... (все импорты остаются теми же)
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
// === ГЛАВНАЯ ФУНКЦИЯ ПРОЦЕССОРА ===
async function processDocxFile(filePath, enabledSteps) {
    const originalFileName = path.basename(filePath);
    const report = {
        fileName: originalFileName,
        success: false,
        logMessages: [`--- Обрабатываю файл: ${originalFileName} ---`]
    };
    try {
        const zip = new adm_zip_1.default(filePath);
        // Группируем шаги по целевому файлу, чтобы читать и писать каждый файл только один раз за конвейер.
        const stepsByFile = {};
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
                }
                else {
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        report.logMessages.push(`  КРИТИЧЕСКАЯ ОШИБКА: ${errorMessage}`);
        report.error = errorMessage;
        report.success = false;
    }
    return report;
}
