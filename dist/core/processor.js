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
// Импортируем все наши атомарные функции
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
// Карта функций для вызова атомов по ID
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
    // replaceSpaceWithNbspAfterNumbering // Пока закомментировано
};
// === ГЛАВНАЯ ФУНКЦИЯ ПРОЦЕССОРА ===
async function processDocxFile(filePath, // Полный путь к исходному файлу
enabledSteps, // Включенные шаги из config.json
outDirectory // Директория для сохранения результата
) {
    const fileName = path.basename(filePath);
    const report = {
        fileName: fileName,
        success: false,
        logMessages: [`--- Обрабатываю файл: ${fileName} ---`]
    };
    try {
        const zip = new adm_zip_1.default(filePath);
        // Загружаем все уникальные целевые файлы из DOCX в память
        const fileContents = {};
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
            // Шаг applyStyles теперь получит templateContent из своих params
            const result = processFunction(currentContent, step.params);
            // Обновляем содержимое в памяти
            fileContents[step.targetFile] = result.xml;
            // Формируем отчет для этого шага
            let stepReportMessage = `Шаг "${step.name}": `;
            if (['applyStyles', 'setPageMargins'].includes(step.id)) {
                stepReportMessage += result.changes > 0 ? `Выполнен.` : `Пропущен (изменений не требовалось).`;
            }
            else {
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        report.logMessages.push(`  КРИТИЧЕСКАЯ ОШИБКА: ${errorMessage}`);
        report.error = errorMessage;
        report.success = false;
    }
    return report;
}
