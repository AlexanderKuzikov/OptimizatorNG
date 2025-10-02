/**
 * Заменяет обычный пробел на неразрывный после ручной нумерации списков
 *
 * Функция находит паттерны вида "1. ", "1.2. ", "10.20.30. " в начале абзацев
 * (внутри первого тега <w:t>) и заменяет пробел после точки на неразрывный (&nbsp;).
 * Это предотвращает перенос номера списка отдельно от текста.
 *
 * Поддерживается до 3 уровней вложенности (например: 1.2.3. ).
 * Многозначные числа поддерживаются (10, 123 и т.д.).
 *
 * @param xmlString - XML-содержимое файла word/document.xml
 * @param params - Параметры обработки (не используются в данной функции)
 * @returns Объект с обработанным XML и количеством произведённых замен
 *
 * @example
 * const result = replaceSpaceWithNbspAfterNumbering('<w:t>1.2. Текст</w:t>', {});
 * // result: { xml: '<w:t>1.2.\u00A0Текст</w:t>', changes: 1 }
 */

interface StepResult {
  xml: string;
  changes: number;
}

export function replaceSpaceWithNbspAfterNumbering(xmlString: string, params: any): StepResult {
  // WHY: Ищем только в начале текстового узла (<w:t>), чтобы не затронуть
  // нумерацию внутри предложений (например, "см. пункт 1.2. в документе")
  // Паттерн: <w:t> + число (одно или несколько цифр) + до 2 повторений ".число" + точка + пробел
  const numberingRegex = /<w:t>(\d+(?:\.\d+){0,2}\.) /g;

  const matches = xmlString.match(numberingRegex);
  const changes = matches ? matches.length : 0;

  // Заменяем обычный пробел на неразрывный Unicode-символ \u00A0
  const xml = xmlString.replace(numberingRegex, '<w:t>$1\u00A0');

  return { xml, changes };
}