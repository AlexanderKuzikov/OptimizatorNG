/**
 * Удаляет повторяющиеся пробелы в текстовых узлах
 *
 * Функция находит все случаи множественных пробелов подряд внутри тегов <w:t>
 * и заменяет их на одиночный пробел. После чистки удаляется технический атрибут
 * xml:space="preserve", который Word автоматически добавляет при наличии
 * множественных пробелов.
 *
 * @param xmlString - XML-содержимое файла word/document.xml
 * @param params - Параметры обработки (не используются в данной функции)
 * @returns Объект с обработанным XML и количеством произведённых замен
 *
 * @example
 * const result = removeDuplicateSpaces('<w:t>Текст  с   пробелами</w:t>', {});
 * // result: { xml: '<w:t>Текст с пробелами</w:t>', changes: 2 }
 */

interface StepResult {
  xml: string;
  changes: number;
}

export function removeDuplicateSpaces(xmlString: string, params: any): StepResult {
  let changes = 0;

  // WHY: Обрабатываем только содержимое внутри <w:t>, не затрагивая структуру XML
  const cleanedXml = xmlString.replace(/(<w:t.*?>)(.*?)(<\/w:t>)/g, (match, openTag, content, closeTag) => {
    const newContent = content.replace(/ {2,}/g, () => {
      changes++;
      return ' ';
    });

    return openTag + newContent + closeTag;
  });

  // WHY: После удаления множественных пробелов атрибут xml:space="preserve"
  // становится избыточным и может вводить в заблуждение парсеры
  const xmlSpaceRegex = /\s+xml:space="preserve"/g;
  const xmlSpaceMatches = cleanedXml.match(xmlSpaceRegex);
  const xmlSpaceChanges = xmlSpaceMatches ? xmlSpaceMatches.length : 0;
  
  const finalXml = cleanedXml.replace(xmlSpaceRegex, '');

  return { xml: finalXml, changes: changes + xmlSpaceChanges };
}