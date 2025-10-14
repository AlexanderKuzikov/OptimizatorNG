import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

interface StepResult {
  xml: string;
  changes: number;
}

const WORD_NAMESPACE = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const DUMMY_TAG = 'dummy';

/**
 * Проверяет, является ли таблица вложенной (находится ли внутри <w:tc>).
 * @param tableElement - DOM-элемент <w:tbl>.
 * @returns true, если таблица вложенная, иначе false.
 */
function isNestedTable(tableElement: Element): boolean {
    const parent = tableElement.parentNode;
    // Проверяем, что родитель существует и является ячейкой таблицы
    return parent !== null && parent.nodeName === 'w:tc';
}

/**
 * Устанавливает ширину печатной области для корневых таблиц, не преобразованных в параграфы.
 * Удаляет отступы таблицы (w:tblInd) справа и слева.
 * Пропускает вложенные таблицы, выводя предупреждение.
 *
 * @param xml - Входящая XML-строка word/document.xml.
 * @param params - Параметры, ожидается { printableWidth: number }.
 * @returns Объект с обновленной XML-строкой и количеством измененных таблиц.
 */
export function setTableWidthForOtherTables(xml: string, params: { printableWidth?: number }): StepResult {
  if (!xml || xml.trim() === '') return { xml: '', changes: 0 };

  let changes = 0;
  const printableWidth = params.printableWidth || 0;

  if (printableWidth === 0) {
      // Это сообщение уже выводится в processor.ts, можно убрать или изменить
      // console.warn("setTableWidthForOtherTables: Параметр 'printableWidth' не был предоставлен или равен 0. Ширина таблиц не будет установлена.");
      return { xml: xml, changes: 0 };
  }
  
  const cleanXml = xml.replace(/<\?xml[^>]*\?>\s*/, '');
  const wrappedXml = `<${DUMMY_TAG} xmlns:w="${WORD_NAMESPACE}">${cleanXml}</${DUMMY_TAG}>`;

  const dom = new JSDOM(wrappedXml, { contentType: 'application/xml' });
  const doc = dom.window.document;

  const tables = Array.from(doc.getElementsByTagNameNS(WORD_NAMESPACE, 'tbl'));

  for (const table of tables) {
    if (isNestedTable(table)) {
        // Пропускаем вложенные таблицы, но добавляем предупреждение в DOM
        const warningRun = doc.createElementNS(WORD_NAMESPACE, 'w:r');
        const warningText = doc.createElementNS(WORD_NAMESPACE, 'w:t');
        warningText.textContent = `ПРЕДУПРЕЖДЕНИЕ: Обнаружена вложенная таблица. Ширина и отступы не будут установлены.`;
        const warningPr = doc.createElementNS(WORD_NAMESPACE, 'w:rPr');
        const color = doc.createElementNS(WORD_NAMESPACE, 'w:color');
        color.setAttribute('w:val', 'FFA500'); // Оранжевый цвет
        warningPr.appendChild(color);
        warningRun.appendChild(warningPr);
        warningRun.appendChild(warningText);

        const warningParagraph = doc.createElementNS(WORD_NAMESPACE, 'w:p');
        warningParagraph.appendChild(warningRun);

        // Вставляем предупреждение перед вложенной таблицей
        if (table.parentNode) {
            table.parentNode.insertBefore(warningParagraph, table);
        }
        continue; // Пропускаем эту вложенную таблицу
    }

    // Если таблица корневая (не вложенная)
    let tblPr = table.getElementsByTagNameNS(WORD_NAMESPACE, 'tblPr')[0];
    if (!tblPr) {
      tblPr = doc.createElementNS(WORD_NAMESPACE, 'w:tblPr');
      table.insertBefore(tblPr, table.firstChild); // Вставляем tblPr в начало таблицы
    }

    // 1. Устанавливаем ширину
    let tblW = tblPr.getElementsByTagNameNS(WORD_NAMESPACE, 'tblW')[0];
    if (!tblW) {
      tblW = doc.createElementNS(WORD_NAMESPACE, 'w:tblW');
      tblPr.appendChild(tblW);
    }
    tblW.setAttribute('w:type', 'dxa');
    tblW.setAttribute('w:w', printableWidth.toString());
    
    // 2. Удаляем отступы таблицы (w:tblInd)
    const tblInd = tblPr.getElementsByTagNameNS(WORD_NAMESPACE, 'tblInd')[0];
    if (tblInd) {
        tblInd.remove(); // Удаляем элемент w:tblInd
    }
    
    changes++; // Увеличиваем счетчик, если внесли изменения в таблицу
  }

  const serializer = new dom.window.XMLSerializer();
  let serializedXml = serializer.serializeToString(doc.documentElement);

  const startTag = `<${DUMMY_TAG} xmlns:w="${WORD_NAMESPACE}">`;
  const endTag = `</${DUMMY_TAG}>`;
  if (serializedXml.startsWith(startTag) && serializedXml.endsWith(endTag)) {
    serializedXml = serializedXml.substring(startTag.length, serializedXml.length - endTag.length);
  }
  
  return { xml: serializedXml, changes };
}