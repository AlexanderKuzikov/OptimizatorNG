import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import * as os from 'os';

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

    let tempDir: string | undefined;

    try {
        const zip = new AdmZip(filePath);
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docx-opt-'));
        zip.extractAllTo(tempDir, true);
        report.logMessages.push(`  Временная папка создана: ${tempDir}`);
        
        const stepsByFile: { [key: string]: ProcessingStep[] } = {};
        for (const step of enabledSteps) {
            if (!stepsByFile[step.targetFile]) {
                stepsByFile[step.targetFile] = [];
            }
            stepsByFile[step.targetFile].push(step);
        }

        for (const targetFileRelativePath in stepsByFile) {
            const fullTargetPath = path.join(tempDir, targetFileRelativePath);

            if (!fs.existsSync(fullTargetPath)) {
                report.logMessages.push(`  Предупреждение: Целевой файл "${targetFileRelativePath}" не найден во временной папке.`);
                continue;
            }
            let currentContent = fs.readFileSync(fullTargetPath, 'utf-8');
            let hasBom = false;

            // --- ИСПРАВЛЕНИЕ: Удаляем BOM и XML-декларацию ОДИН РАЗ, в самом начале ---
            if (currentContent.charCodeAt(0) === 0xFEFF) {
                hasBom = true;
                currentContent = currentContent.substring(1);
            }
            currentContent = currentContent.replace(/<\?xml[^>]*\?>\s*/, '');
            // --------------------------------------------------------------------------

            // currentContent теперь всегда чистый, без BOM и <?xml...>

            for (const step of stepsByFile[targetFileRelativePath]) {
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
            
            // --- ДОБАВЛЯЕМ XML-декларацию и BOM обратно ПЕРЕД ЗАПИСЬЮ ---
            let finalOutputContent = currentContent;
            if (targetFileRelativePath.endsWith('.xml')) {
                finalOutputContent = XML_DECLARATION + finalOutputContent;
                if (hasBom) {
                    finalOutputContent = BOM + finalOutputContent;
                }
            }
            // -------------------------------------------------------------
            
            fs.writeFileSync(fullTargetPath, finalOutputContent, 'utf-8');
        }

        const originalDirectory = path.dirname(filePath);
        const newFileName = `cleared_${originalFileName}`;
        const outPath = path.join(originalDirectory, newFileName);
        
        const newZip = new AdmZip();
        newZip.addLocalFolder(tempDir);
        newZip.writeZip(outPath);

        report.logMessages.push(`  Успешно сохранено в: ${outPath}`);
        report.success = true;

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        report.logMessages.push(`  КРИТИЧЕСКАЯ ОШИБКА: ${errorMessage}`);
        report.error = errorMessage;
        report.success = false;
    } finally {
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            report.logMessages.push(`  Временная папка удалена: ${tempDir}`);
        }
    }
    return report;
}