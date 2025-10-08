import { JSDOM } from 'jsdom';

interface StepResult {
  xml: string;
  changes: number;
}

export function cleanupParaProps(xml: string, params: any): StepResult {
  if (!xml || xml.trim() === '') return { xml: '', changes: 0 };
  let changes = 0;
  const dummyTag = 'dummy';
  const namespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  const cleanXml = xml.replace(/<\?xml[^>]*\?>\s*/, '');
  const wrappedXml = `<${dummyTag} xmlns:w="${namespace}">${cleanXml}</${dummyTag}>`;

  const dom = new JSDOM(wrappedXml, { contentType: 'application/xml' });
  const doc = dom.window.document;
  
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
    const serializer = new dom.window.XMLSerializer();
    let serializedXml = serializer.serializeToString(doc.documentElement);
    // ИСПРАВЛЕНИЕ: УБРАН \n
    serializedXml = serializedXml.replace(/<\/w:p><w:p>/g, '</w:p><w:p>');

    const startTag = `<${dummyTag} xmlns:w="${namespace}">`;
    const endTag = `</${dummyTag}>`;
    if (serializedXml.startsWith(startTag) && serializedXml.endsWith(endTag)) {
      const finalXml = serializedXml.substring(startTag.length, serializedXml.length - endTag.length);
      return { xml: finalXml, changes };
    }
    return { xml, changes: 0 };
  }
  return { xml, changes: 0 };
}