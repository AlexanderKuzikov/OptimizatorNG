import { JSDOM } from 'jsdom';

interface StepResult {
  xml: string;
  changes: number;
}

const WORD_NAMESPACE = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const DUMMY_TAG = 'dummy';
const STYLE_TABULAR1 = 'Tabular1';
const STYLE_TABULAR2 = 'Tabular2'; // Новый стиль для подписи

/**
 * Ищет параграфы стиля 'Tabular1' с текстом 'ФИО', удаляет первую табуляцию и назначает стиль 'Tabular2'.
 *
 * @param xml - Входящая XML-строка word/document.xml.
 * @param params - Параметры (не используются в данной функции).
 * @returns Объект с обновленной XML-строкой и количеством измененных параграфов.
 */
export function applySignatureFormatting(xml: string, params: any): StepResult {
  if (!xml || xml.trim() === '') return { xml: '', changes: 0 };

  let changes = 0;
  
  const cleanXml = xml.replace(/<\?xml[^>]*\?>\s*/, '');
  const wrappedXml = `<${DUMMY_TAG} xmlns:w="${WORD_NAMESPACE}">${cleanXml}</${DUMMY_TAG}>`;

  const dom = new JSDOM(wrappedXml, { contentType: 'application/xml' });
  const doc = dom.window.document;

  const paragraphs = Array.from(doc.getElementsByTagNameNS(WORD_NAMESPACE, 'p'));

  for (const p of paragraphs) {
    const pStyle = p.getElementsByTagNameNS(WORD_NAMESPACE, 'pStyle')[0];
    if (pStyle && pStyle.getAttribute('w:val') === STYLE_TABULAR1) {
      // Собираем весь текст параграфа для поиска "ФИО"
      const fullText = Array.from(p.getElementsByTagNameNS(WORD_NAMESPACE, 't'))
                            .map(t => t.textContent || '')
                            .join('');
      
      if (fullText.includes('ФИО')) {
        // Найдено "ФИО" и стиль "Tabular1"
        // Удаляем первую табуляцию
        const runs = Array.from(p.getElementsByTagNameNS(WORD_NAMESPACE, 'r'));
        for (const run of runs) {
          if (run.getElementsByTagNameNS(WORD_NAMESPACE, 'tab').length > 0) {
            run.remove(); // Удаляем весь run, содержащий w:tab
            break; // Удаляем только первую табуляцию
          }
        }
        
        // Меняем стиль на "Tabular2"
        pStyle.setAttribute('w:val', STYLE_TABULAR2);
        changes++;
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
  
  return { xml: serializedXml, changes };
}