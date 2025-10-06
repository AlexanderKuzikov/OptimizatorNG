import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import is from '@sindresorhus/is';

interface StepResult {
  xml: string;
  changes: number;
}

export function replaceSpaceWithNbspAfterNumbering(xml: string, params: any): StepResult {
  if (is.emptyStringOrWhitespace(xml)) {
    return { xml: '', changes: 0 };
  }

  let totalChanges = 0;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<dummy>${xml}</dummy>`, 'application/xml');

  const textNodes = Array.from(doc.getElementsByTagName('w:t'));

  for (const t of textNodes) {
    let text = t.textContent || '';
    let nodeChanged = false;

    // --- ЭТАП 1: Замена пробела на неразрывный после нумерации ---
    const numberingRegex = /^((\d+\.){1,3}) /;
    if (numberingRegex.test(text)) {
      // ИСПРАВЛЕНИЕ: Используем Unicode-символ \u00A0 вместо сущности &nbsp;
      text = text.replace(numberingRegex, '$1\u00A0');
      nodeChanged = true;
      totalChanges++;
    }

    // --- ЭТАП 2: Установка xml:space="preserve" ---
    if (text.startsWith(' ') || text.endsWith(' ')) {
      if (t.getAttribute('xml:space') !== 'preserve') {
        t.setAttribute('xml:space', 'preserve');
        if (!nodeChanged) {
          totalChanges++;
        }
        nodeChanged = true;
      }
    }

    if (nodeChanged) {
      while (t.firstChild) {
        t.removeChild(t.firstChild);
      }
      // Теперь сюда будет вставлен правильный Unicode-символ
      t.appendChild(doc.createTextNode(text));
    }
  }

  if (totalChanges > 0) {
    const serializer = new XMLSerializer();
    const fullXml = serializer.serializeToString(doc);
    const finalXml = fullXml.substring('<dummy>'.length, fullXml.length - '</dummy>'.length);
    return { xml: finalXml, changes: totalChanges };
  }

  return { xml, changes: 0 };
}