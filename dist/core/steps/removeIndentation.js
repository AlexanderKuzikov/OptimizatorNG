"use strict";
/**
 * Удаляет все теги <w:ind> из параграфов документа
 *
 * Функция убирает ручные отступы абзацев (left, right, firstLine, hanging),
 * оставляя только глобальные стили. Это необходимо для унификации форматирования
 * шаблонов Kombinator.
 *
 * @param xmlString - XML-содержимое файла word/document.xml
 * @param params - Параметры обработки (не используются в данной функции)
 * @returns Объект с обработанным XML и количеством произведённых замен
 *
 * @example
 * const result = removeIndentation('<w:p><w:pPr><w:ind w:left="720"/></w:pPr></w:p>', {});
 * // result: { xml: '<w:p><w:pPr></w:pPr></w:p>', changes: 1 }
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeIndentation = removeIndentation;
function removeIndentation(xmlString, params) {
    // WHY: Регулярное выражение находит все самозакрывающиеся теги <w:ind>
    // с любыми атрибутами (left, right, firstLine, hanging)
    const indentationRegex = /<w:ind[^>]*\/>/g;
    const matches = xmlString.match(indentationRegex);
    const changes = matches ? matches.length : 0;
    const xml = xmlString.replace(indentationRegex, '');
    return { xml, changes };
}
