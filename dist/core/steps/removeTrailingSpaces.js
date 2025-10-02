"use strict";
/**
 * Интеллигентно сокращает пробелы и табы в конце текстовых блоков до одного.
 *
 * Функция находит два и более пробела/таба в конце содержимого тега <w:t>
 * и заменяет их на один пробел.
 * - <w:t>текст   </w:t> -> <w:t>текст </w:t>
 * - НЕ ТРОГАЕТ теги, где в конце один пробел: <w:t>текст </w:t>
 * - НЕ ТРОГАЕТ теги, содержащие только пробелы: <w:t>   </w:t>
 *
 * @param xmlString - XML-содержимое файла word/document.xml
 * @param params - Параметры обработки (не используются в данной функции)
 * @returns Объект с обработанным XML и количеством произведённых замен
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTrailingSpaces = removeTrailingSpaces;
function removeTrailingSpaces(xmlString, params) {
    let changes = 0;
    const regex = /<w:t([^>]*)>([\s\S]*?)<\/w:t>/g;
    const cleanedXml = xmlString.replace(regex, (match, attributes, content) => {
        // Проверяем, есть ли в контенте что-то кроме пробелов
        if (/\S/.test(content)) {
            const newContent = content.replace(/[ \t]{2,}$/, ' ');
            if (content !== newContent) {
                changes++;
            }
            return `<w:t${attributes}>${newContent}</w:t>`;
        }
        // Если в теге только пробелы или он пуст - возвращаем как есть
        return match;
    });
    return { xml: cleanedXml, changes };
}
