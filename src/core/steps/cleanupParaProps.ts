import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

interface StepResult {
  xml: string;
  changes: number;
}

export function cleanupParaProps(xml: string, params: any): StepResult {
  if (!xml || xml.trim() === '') {
    return { xml: '', changes: 0 };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<dummy>${xml}</dummy>`, 'application/xml');
  let changes = 0;

  const allPPrs = Array.from(doc.getElementsByTagName('w:pPr'));

  for (const pPr of allPPrs) {
    const parent = pPr.parentNode;
    if (!parent || parent.nodeName !== 'w:p') {
      if (parent) {
        parent.removeChild(pPr);
        changes++;
      }
      continue;
    }

    const rPrs = Array.from(pPr.getElementsByTagName('w:rPr'));
    if (rPrs.length > 0) {
      rPrs.forEach(rPr => {
        pPr.removeChild(rPr);
        changes++;
      });
    }
  }

  if (changes > 0) {
    const serializer = new XMLSerializer();
    const fullXml = serializer.serializeToString(doc);
    const finalXml = fullXml.substring('<dummy>'.length, fullXml.length - '</dummy>'.length);
    return { xml: finalXml, changes };
  }

  return { xml, changes: 0 };
}