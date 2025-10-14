import { JSDOM } from 'jsdom';

interface StepResult {
  xml: string;
  changes: number;
}

const TABLE_HEADER_STYLE_NAME = 'Tabular1';
const WORD_NAMESPACE = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const DUMMY_TAG = 'dummy'; // Используем константу для dummyTag

/**
 * Извлекает все <w:r> элементы из всех <w:p> в ячейке, объединяя их.
 * Множественные абзацы внутри ячейки будут разделены <w:br/>.
 *
 * @param cellElement - DOM-элемент <w:tc>.
 * @param doc - Документ JSDOM для создания новых элементов.
 * @returns {runsXml: string, hasText: boolean} Объект с конкатенированным XML всех <w:r> и флагом наличия текста.
 */
function extractRunsAndTextFlagFromCell(cellElement: Element, doc: Document): { runsXml: string; hasText: boolean } {
  let allRunsContent: Element[] = []; // Сохраняем DOM-элементы для последующей вставки
  let hasTextInCell = false;
  
  // Используем getElementsByTagNameNS для корректной работы с пространствами имен
  const paragraphs = Array.from(cellElement.getElementsByTagNameNS(WORD_NAMESPACE, 'p'));

  for (const p of paragraphs) {
    let runsContentFromParagraph: Element[] = [];
    let hasTextInParagraph = false;
    const runs = Array.from(p.getElementsByTagNameNS(WORD_NAMESPACE, 'r'));

    for (const r of runs) {
      // Клонируем run, чтобы не изменять исходный DOM ячейки до того, как будем готовы заменить всю таблицу
      runsContentFromParagraph.push(r.cloneNode(true) as Element); 
      // Проверяем наличие <w:t> с содержимым, игнорируя только пробелы
      const texts = Array.from(r.getElementsByTagNameNS(WORD_NAMESPACE, 't'));
      if (texts.some(t => (t.textContent || '').trim() !== '')) {
        hasTextInParagraph = true;
      }
    }

    if (hasTextInParagraph) {
      if (hasTextInCell) {
        // Если в предыдущих абзацах уже был текст, добавляем разделитель (разрыв строки)
        const brRun = doc.createElementNS(WORD_NAMESPACE, 'w:r');
        brRun.appendChild(doc.createElementNS(WORD_NAMESPACE, 'w:br'));
        allRunsContent.push(brRun);
      }
      allRunsContent.push(...runsContentFromParagraph);
      hasTextInCell = true;
    }
  }

  // Сериализуем собранные run-элементы в XML-строку, чтобы потом JSDOM мог их снова распарсить
  const tempDiv = doc.createElement('div'); // Временный контейнер для сериализации
  allRunsContent.forEach(run => tempDiv.appendChild(run));
  const runsXml = tempDiv.innerHTML;

  return { runsXml: runsXml, hasText: hasTextInCell };
}

/**
 * Конвертирует двухколоночные таблицы в параграфы с табуляцией.
 * Каждая строка таблицы преобразуется в один параграф.
 * Содержимое первой ячейки, затем табуляция, затем содержимое второй ячейки.
 * Параграфы внутри ячеек объединяются с переносом строки.
 *
 * @param xml - Входящая XML-строка, может быть фрагментом word/document.xml.
 * @param params - Параметры (не используются в данной функции).
 * @returns Объект с обновленной XML-строкой и количеством обработанных таблиц.
 */
export function convertTwoColumnTablesToTabbedParagraphs(xml: string, params: any): StepResult {
  if (!xml || xml.trim() === '') return { xml: '', changes: 0 };

  let tablesProcessedCount = 0;
  
  // Удаляем XML-декларацию для корректного парсинга JSDOM, как и в других функциях
  const cleanXml = xml.replace(/<\?xml[^>]*\?>\s*/, '');
  // Оборачиваем в dummy-тег с объявлением пространства имен, как в mergeInstructionTextRuns
  const wrappedXml = `<${DUMMY_TAG} xmlns:w="${WORD_NAMESPACE}">${cleanXml}</${DUMMY_TAG}>`;

  const dom = new JSDOM(wrappedXml, { contentType: 'application/xml' });
  const doc = dom.window.document;

  // Используем getElementsByTagNameNS для поиска элементов в пространстве имен Word
  const tables = Array.from(doc.getElementsByTagNameNS(WORD_NAMESPACE, 'tbl'));

  for (const table of tables) {
    const rows = Array.from(table.getElementsByTagNameNS(WORD_NAMESPACE, 'tr'));
    
    // Проверяем, является ли таблица двухколоночной и имеет ли строки
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
        // Передаем doc в extractRunsAndTextFlagFromCell для создания элементов
        const cell1Data = extractRunsAndTextFlagFromCell(cells[0], doc);
        const cell2Data = extractRunsAndTextFlagFromCell(cells[1], doc);

        const newParagraph = doc.createElementNS(WORD_NAMESPACE, 'w:p');
        
        // Применяем стиль "Tabular1"
        const pPr = doc.createElementNS(WORD_NAMESPACE, 'w:pPr');
        const pStyle = doc.createElementNS(WORD_NAMESPACE, 'w:pStyle');
        pStyle.setAttribute('w:val', TABLE_HEADER_STYLE_NAME);
        pPr.appendChild(pStyle);
        newParagraph.appendChild(pPr);

        // Добавляем первую табуляцию
        const tabRun1 = doc.createElementNS(WORD_NAMESPACE, 'w:r');
        tabRun1.appendChild(doc.createElementNS(WORD_NAMESPACE, 'w:tab')); // <w:tab/>
        newParagraph.appendChild(tabRun1);

        // Добавляем содержимое первой ячейки
        // Используем JSDOM для парсинга runsXml обратно в DOM-элементы и добавления в newParagraph
        if (cell1Data.hasText) {
          const tempContainer = dom.window.document.createElement('div');
          tempContainer.innerHTML = cell1Data.runsXml;
          Array.from(tempContainer.children).forEach(child => {
            newParagraph.appendChild(child.cloneNode(true));
          });
        }

        // Добавляем вторую табуляцию
        const tabRun2 = doc.createElementNS(WORD_NAMESPACE, 'w:r');
        tabRun2.appendChild(doc.createElementNS(WORD_NAMESPACE, 'w:tab')); // <w:tab/>
        newParagraph.appendChild(tabRun2);

        // Добавляем содержимое второй ячейки
        if (cell2Data.hasText) {
          const tempContainer = dom.window.document.createElement('div');
          tempContainer.innerHTML = cell2Data.runsXml;
          Array.from(tempContainer.children).forEach(child => {
            newParagraph.appendChild(child.cloneNode(true));
          });
        }
        
        generatedParagraphsForTable.push(newParagraph);
      }
      
      // Заменяем таблицу на сгенерированные параграфы
      const parent = table.parentNode;
      if (parent) {
        // Вставляем новые параграфы перед таблицей
        generatedParagraphsForTable.forEach(p => parent.insertBefore(p, table));
        // Удаляем оригинальную таблицу
        parent.removeChild(table);
      }
    }
  }

  const serializer = new dom.window.XMLSerializer();
  let serializedXml = serializer.serializeToString(doc.documentElement);

  // Очистка от оберточного тега dummy, как в mergeInstructionTextRuns
  const startTag = `<${DUMMY_TAG} xmlns:w="${WORD_NAMESPACE}">`;
  const endTag = `</${DUMMY_TAG}>`;
  if (serializedXml.startsWith(startTag) && serializedXml.endsWith(endTag)) {
    serializedXml = serializedXml.substring(startTag.length, serializedXml.length - endTag.length);
  }
  
  // Мы не добавляем <?xml ...?> обратно, так как processor.ts занимается этим на корневом уровне.
  // Эта функция должна возвращать обработанный XML-фрагмент.
  
  return { xml: serializedXml, changes: tablesProcessedCount };
}