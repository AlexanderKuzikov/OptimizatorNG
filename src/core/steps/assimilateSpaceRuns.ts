import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import is from '@sindresorhus/is';

interface StepResult {
  xml: string;
  changes: number;
}

/**
 * Finds <w:r> elements that contain a <w:t> with a single space and merges
 * that space into the preceding <w:r> element's text, ignoring any formatting on the space run.
 *
 * @param xml The XML content of the document as a string.
 * @param params Unused for this step.
 * @returns An object containing the optimized XML and the number of merges performed.
 */
export function assimilateSpaceRuns(xml: string, params: any): StepResult {
  if (is.emptyStringOrWhitespace(xml)) {
    return { xml: '', changes: 0 };
  }

  let changes = 0;
  const dummyTag = 'dummy';
  const namespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const wrappedXml = `<${dummyTag} xmlns:w="${namespace}">${xml}</${dummyTag}>`;
  const parser = new DOMParser();
  const doc = parser.parseFromString(wrappedXml, 'application/xml');

  const paragraphs = Array.from(doc.getElementsByTagName('w:p'));

  for (const p of paragraphs) {
    const runs = Array.from(p.getElementsByTagName('w:r'));
    if (runs.length < 2) {
      continue;
    }

    let i = 1;
    while (i < runs.length) {
      const currentRun = runs[i];
      const textNode = currentRun.getElementsByTagName('w:t')[0];

      // **ИСПРАВЛЕННАЯ ЛОГИКА:**
      // Ищем <w:r>, у которого есть <w:t> с единственным пробелом.
      // Нам неважно, есть ли у этого <w:r> другие дочерние узлы (например, <w:rPr>).
      const isSpaceRun = textNode && textNode.textContent === ' ';

      if (isSpaceRun) {
        // Дополнительная проверка: убедимся, что в <w:t> нет ничего, кроме пробела
        const textChildren = Array.from(textNode.childNodes);
        if (textChildren.length === 1 && textChildren[0].nodeType === 3 /* TEXT_NODE */) {
            const prevRun = runs[i - 1];
            if (prevRun) {
                const prevTextNode = prevRun.getElementsByTagName('w:t')[0];
                if (prevTextNode) {
                    prevTextNode.textContent += ' ';
                    p.removeChild(currentRun);
                    changes++;
                    runs.splice(i, 1);
                    continue; 
                }
            }
        }
      }
      i++;
    }
  }

  if (changes > 0) {
    const serializer = new XMLSerializer();
    const fullXmlString = serializer.serializeToString(doc);
    const startTag = `<${dummyTag} xmlns:w="${namespace}">`;
    const endTag = `</${dummyTag}>`;

    if (fullXmlString.startsWith(startTag) && fullXmlString.endsWith(endTag)) {
      const finalXml = fullXmlString.substring(startTag.length, fullXmlString.length - endTag.length);
      return { xml: finalXml, changes };
    }
  }

  return { xml, changes: 0 };
}