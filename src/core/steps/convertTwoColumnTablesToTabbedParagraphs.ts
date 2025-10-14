import { JSDOM } from 'jsdom';

interface StepResult {
  xml: string;
  changes: number;
}

const TABLE_HEADER_STYLE_NAME = 'Tabular1';
const WORD_NAMESPACE = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const DUMMY_TAG = 'dummy';

/**
 * Извлекает все <w:r> элементы из всех <w:p> в ячейке, объединяя их.
 * Множественные абзацы внутри ячейки будут разделены <w:br/>.
 *
 * @param cellElement - DOM-элемент <w:tc>.
 * @param doc - Документ JSDOM для создания новых элементов.
 * @returns {runsXml: string, hasText: boolean} Объект с конкатенированным XML всех <w:r> и флагом наличия текста.
 */
function extractRunsAndTextFlagFromCell(cellElement: Element, doc: Document): { runsXml: string; hasText: boolean; } {
  let allRunsContent: Element[] = [];
  let hasTextInCell = false;
  
  // !!! ОТКЛЮЧЕНО: Проверка на наличие вложенных таблиц
  // if (cellElement.getElementsByTagNameNS(WORD_NAMESPACE, 'tbl').length > 0) {
  //   return { runsXml: '', hasText: false, hasNestedTable: true };
  // }

  const paragraphs = Array.from(cellElement.getElementsByTagNameNS(WORD_NAMESPACE, 'p'));

  for (const p of paragraphs) {
    let runsContentFromParagraph: Element[] = [];
    let hasTextInParagraph = false;
    const runs = Array.from(p.getElementsByTagNameNS(WORD_NAMESPACE, 'r'));

    for (const r of runs) {
      runsContentFromParagraph.push(r.cloneNode(true) as Element); 
      const texts = Array.from(r.getElementsByTagNameNS(WORD_NAMESPACE, 't'));
      if (texts.some(t => (t.textContent || '').trim() !== '')) {
        hasTextInParagraph = true;
      }
    }

    if (hasTextInParagraph) {
      if (hasTextInCell) {
        const brRun = doc.createElementNS(WORD_NAMESPACE, 'w:r');
        brRun.appendChild(doc.createElementNS(WORD_NAMESPACE, 'w:br'));
        allRunsContent.push(brRun);
      }
      allRunsContent.push(...runsContentFromParagraph);
      hasTextInCell = true;
    }
  }

  const tempDiv = doc.createElement('div');
  allRunsContent.forEach(run => tempDiv.appendChild(run));
  const runsXml = tempDiv.innerHTML;

  return { runsXml: runsXml, hasText: hasTextInCell }; // !!! hasNestedTable удален
}

/**
 * Конвертирует двухколоночные таблицы в параграфы с табуляцией.
 * Каждая строка таблицы преобразуется в один параграф.
 * Содержимое первой ячейки, затем табуляция, затем содержимое второй ячейки.
 * Параграфы внутри ячеек объединяются с переносом строки.
 * В этой версии проверка на вложенные таблицы ОТКЛЮЧЕНА.
 *
 * @param xml - Входящая XML-строка word/document.xml.
 * @param params - Параметры (не используются в данной функции).
 * @returns Объект с обновленной XML-строкой и количеством обработанных таблиц.
 */
export function convertTwoColumnTablesToTabbedParagraphs(xml: string, params: any): StepResult {
  if (!xml || xml.trim() === '') return { xml: '', changes: 0 };

  let tablesProcessedCount = 0;
  
  const cleanXml = xml.replace(/<\?xml[^>]*\?>\s*/, '');
  const wrappedXml = `<${DUMMY_TAG} xmlns:w="${WORD_NAMESPACE}">${cleanXml}</${DUMMY_TAG}>`;

  const dom = new JSDOM(wrappedXml, { contentType: 'application/xml' });
  const doc = dom.window.document;

  const tables = Array.from(doc.getElementsByTagNameNS(WORD_NAMESPACE, 'tbl'));

  for (const table of tables) {
    const rows = Array.from(table.getElementsByTagNameNS(WORD_NAMESPACE, 'tr'));
    
    let isTwoColumnTable = rows.length > 0;
    if (isTwoColumnTable) { 
        for (const row of rows) {
            const cells = Array.from(row.getElementsByTagNameNS(WORD_NAMESPACE, 'tc'));
            if (cells.length !== 2) { // Строго две колонки
                isTwoColumnTable = false;
                break;
            }
        }
    }
    
    if (isTwoColumnTable) {
      tablesProcessedCount++;
      let generatedParagraphsForTable: Element[] = [];

      for (const row of rows) {
        const cells = Array.from(row.getElementsByTagNameNS(WORD_NAMESPACE, 'tc'));
        
        // !!! ОТКЛЮЧЕНО: Проверка на вложенные таблицы
        const cell1Data = extractRunsAndTextFlagFromCell(cells[0], doc);
        const cell2Data = extractRunsAndTextFlagFromCell(cells[1], doc);

        // if (cell1Data.hasNestedTable || cell2Data.hasNestedTable) {
        //     // Код для добавления предупреждения удален, так как проверка отключена
        //     continue; 
        // }

        const newParagraph = doc.createElementNS(WORD_NAMESPACE, 'w:p');
        
        const pPr = doc.createElementNS(WORD_NAMESPACE, 'w:pPr');
        const pStyle = doc.createElementNS(WORD_NAMESPACE, 'w:pStyle');
        pStyle.setAttribute('w:val', TABLE_HEADER_STYLE_NAME);
        pPr.appendChild(pStyle);
        newParagraph.appendChild(pPr);

        const tabRun1 = doc.createElementNS(WORD_NAMESPACE, 'w:r');
        tabRun1.appendChild(doc.createElementNS(WORD_NAMESPACE, 'w:tab'));
        newParagraph.appendChild(tabRun1);

        if (cell1Data.hasText) {
          const tempContainer = dom.window.document.createElement('div');
          tempContainer.innerHTML = cell1Data.runsXml;
          Array.from(tempContainer.children).forEach(child => {
            newParagraph.appendChild(child.cloneNode(true));
          });
        }

        const tabRun2 = doc.createElementNS(WORD_NAMESPACE, 'w:r');
        tabRun2.appendChild(doc.createElementNS(WORD_NAMESPACE, 'w:tab'));
        newParagraph.appendChild(tabRun2);

        if (cell2Data.hasText) {
          const tempContainer = dom.window.document.createElement('div');
          tempContainer.innerHTML = cell2Data.runsXml;
          Array.from(tempContainer.children).forEach(child => {
            newParagraph.appendChild(child.cloneNode(true));
          });
        }
        
        generatedParagraphsForTable.push(newParagraph);
      }
      
      const parent = table.parentNode;
      if (parent) {
        generatedParagraphsForTable.forEach(p => parent.insertBefore(p, table));
        parent.removeChild(table);
      }
    }
  }

  const serializer = new dom.window.XMLSerializer();
  let serializedXml = serializer.serializeToString(doc.documentElement);

  const startTag = `<${DUMMY_TAG} xmlns:w="${WORD_NAMESPACE}">`;
  const endTag = `</${DUMMY_TAG}>`;
  if (serializedXml.startsWith(startTag) && serializedXml.endsWith(endTag)) {
    serializedXml = serializedXml.substring(startTag.length, serializedXml.length - endTag.length);
  }
  
  return { xml: serializedXml, changes: tablesProcessedCount };
}