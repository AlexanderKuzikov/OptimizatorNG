// src/core/steps/applyStyles.ts
// Убираем импорты fs и path, так как файл больше не читается с диска
// import * as fs from 'fs';
// import * as path from 'path';

interface StepResult { xml: string; changes: number; }

/**
 * Заменяет содержимое файла стилей на содержимое эталонного шаблона,
 * переданное как параметр.
 * @param xmlString Входящая XML-строка (игнорируется).
 * @param params Параметры, содержащие содержимое файла-шаблона.
 * @returns Содержимое файла-шаблона.
 */
export function applyStyles(xmlString: string, params: { templateContent: string }): StepResult {
  const { templateContent } = params;
  
  // Если текущее содержимое уже совпадает с шаблоном, изменений нет
  if (xmlString === templateContent) {
    return { xml: xmlString, changes: 0 };
  }
  
  // В противном случае, заменяем и считаем 1 изменение
  return { xml: templateContent, changes: 1 };
}