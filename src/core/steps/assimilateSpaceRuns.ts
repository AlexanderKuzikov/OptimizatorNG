import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

interface StepResult {
  xml: string;
  changes: number;
}

export function assimilateSpaceRuns(xml: string, params: any): StepResult {
  if (!xml || xml.trim() === '') {
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
      const isSpaceRun = textNode && textNode.textContent === ' ';

      if (isSpaceRun) {
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