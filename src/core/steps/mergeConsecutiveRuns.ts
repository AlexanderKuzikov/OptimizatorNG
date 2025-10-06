import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import is from '@sindresorhus/is';

interface StepResult {
  xml: string;
  changes: number;
}

/**
 * Creates a deterministic signature for a w:rPr node based on its direct child elements and their attributes.
 * This signature is used to identify runs with identical formatting.
 */
function getFormattingSignature(rPrNode: Element | null): string {
  if (!rPrNode || !rPrNode.childNodes || rPrNode.childNodes.length === 0) {
    return '';
  }

  let signatureParts: string[] = [];
  const children = Array.from(rPrNode.childNodes).filter(
    (node): node is Element => node.nodeType === 1,
  );

  for (const child of children) {
    const tagName = child.nodeName.replace(/^w:/, '');
    let attrPart = '';
    const valAttr = child.getAttribute('w:val');
    if (valAttr !== null) {
      attrPart += `[val:${valAttr}]`;
    }
    signatureParts.push(`${tagName}${attrPart}`);
  }

  signatureParts.sort();
  return signatureParts.join(';');
}

/**
 * Merges consecutive <w:r> elements in a DOCX file that have identical formatting.
 *
 * @param xml - The XML content of the document as a string.
 * @param params - Unused for this step.
 * @returns An object containing the optimized XML and the number of merges performed.
 */
export function mergeConsecutiveRuns(xml: string, params: any): StepResult {
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

    let i = 0;
    while (i < runs.length - 1) {
      const currentRun = runs[i];
      const nextRun = runs[i + 1];

      if (currentRun.nextSibling !== nextRun) {
        i++;
        continue;
      }

      const rPrCurrent = currentRun.getElementsByTagName('w:rPr')[0] || null;
      const rPrNext = nextRun.getElementsByTagName('w:rPr')[0] || null;
      const sigCurrent = getFormattingSignature(rPrCurrent);
      const sigNext = getFormattingSignature(rPrNext);

      if (sigCurrent === sigNext) {
        const textNodeCurrent = currentRun.getElementsByTagName('w:t')[0];
        const textNodeNext = nextRun.getElementsByTagName('w:t')[0];

        if (textNodeCurrent && textNodeNext) {
          const currentText = textNodeCurrent.textContent || '';
          const nextText = textNodeNext.textContent || '';
          textNodeCurrent.textContent = currentText + nextText;
          
          p.removeChild(nextRun);
          changes++; // Увеличиваем счетчик изменений
          runs.splice(i + 1, 1);
        } else {
          i++;
        }
      } else {
        i++;
      }
    }
  }

  const serializer = new XMLSerializer();
  const fullXmlString = serializer.serializeToString(doc);
  const startTag = `<${dummyTag} xmlns:w="${namespace}">`;
  const endTag = `</${dummyTag}>`;
  
  // Исправленная логика, чтобы всегда возвращать StepResult
  if (changes > 0 && fullXmlString.startsWith(startTag) && fullXmlString.endsWith(endTag)) {
    const finalXml = fullXmlString.substring(startTag.length, fullXmlString.length - endTag.length);
    return { xml: finalXml, changes };
  }

  // Если изменений не было, возвращаем исходный XML и 0 изменений.
  return { xml, changes: 0 };
}