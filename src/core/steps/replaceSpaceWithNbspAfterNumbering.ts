import { JSDOM } from 'jsdom';

interface StepResult {
  xml: string;
  changes: number;
}

export function replaceSpaceWithNbspAfterNumbering(xml: string, params: any): StepResult {
  if (!xml || xml.trim() === '') return { xml: '', changes: 0 };
  let totalChanges = 0;
  const dummyTag = 'dummy';
  const namespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  
  const cleanXml = xml.replace(/<\?xml[^>]*\?>\s*/, '');
  const wrappedXml = `<${dummyTag} xmlns:w="${namespace}">${cleanXml}</${dummyTag}>`;

  const dom = new JSDOM(wrappedXml, { contentType: 'application/xml' });
  const doc = dom.window.document;

  const textNodes = Array.from(doc.getElementsByTagName('w:t'));
  for (const t of textNodes) {
    let originalText = t.textContent || '';
    let processedText = originalText;
    let nodeChanged = false;
    const numberingRegex = /^(\s*)((?:\d+\.){1,3}) /;
    if (numberingRegex.test(processedText)) {
      processedText = processedText.replace(numberingRegex, '$1$2\u00A0');
      nodeChanged = true;
    }
    if (processedText.trim() !== processedText || processedText.includes('\u00A0')) {
      if (t.getAttribute('xml:space') !== 'preserve') {
        t.setAttribute('xml:space', 'preserve');
        nodeChanged = true;
      }
    }
    if (nodeChanged) {
      if (t.textContent !== processedText) {
          while (t.firstChild) { t.removeChild(t.firstChild); }
          t.appendChild(doc.createTextNode(processedText));
      }
      totalChanges++;
    }
  }

  if (totalChanges > 0) {
    const serializer = new dom.window.XMLSerializer();
    let serializedXml = serializer.serializeToString(doc.documentElement);
    serializedXml = serializedXml.replace(/<\/w:p><w:p>/g, '</w:p>\n<w:p>');

    const startTag = `<${dummyTag} xmlns:w="${namespace}">`;
    const endTag = `</${dummyTag}>`;
    if (serializedXml.startsWith(startTag) && serializedXml.endsWith(endTag)) {
      const finalXml = serializedXml.substring(startTag.length, serializedXml.length - endTag.length);
      return { xml: finalXml, changes: totalChanges };
    }
    return { xml, changes: 0 };
  }
  return { xml, changes: 0 };
}