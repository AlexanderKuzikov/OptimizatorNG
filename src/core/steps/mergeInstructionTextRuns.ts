import { JSDOM } from 'jsdom';

interface StepResult {
  xml: string;
  changes: number;
}

export function mergeInstructionTextRuns(xml: string, params: any): StepResult {
  if (!xml || xml.trim() === '') return { xml: '', changes: 0 };
  let changes = 0;
  const dummyTag = 'dummy';
  const namespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  
  const cleanXml = xml.replace(/<\?xml[^>]*\?>\s*/, '');
  const wrappedXml = `<${dummyTag} xmlns:w="${namespace}">${cleanXml}</${dummyTag}>`;

  const dom = new JSDOM(wrappedXml, { contentType: 'application/xml' });
  const doc = dom.window.document;
  
  const paragraphs = Array.from(doc.getElementsByTagName('w:p'));
  for (const p of paragraphs) {
    let runs = Array.from(p.getElementsByTagName('w:r'));
    if (runs.length < 2) continue;
    let i = 0;
    while (i < runs.length - 1) {
      const currentRun = runs[i];
      const nextRun = runs[i + 1];
      if (currentRun.nextElementSibling !== nextRun) { i++; continue; }
      const instrTextCurrent = currentRun.getElementsByTagName('w:instrText')[0];
      const instrTextNext = nextRun.getElementsByTagName('w:instrText')[0];
      if (instrTextCurrent && instrTextNext) {
        instrTextCurrent.textContent = (instrTextCurrent.textContent || '') + (instrTextNext.textContent || '');
        p.removeChild(nextRun);
        changes++;
        runs.splice(i + 1, 1);
      } else { i++; }
    }
  }

  if (changes > 0) {
    const serializer = new dom.window.XMLSerializer();
    let serializedXml = serializer.serializeToString(doc.documentElement);
    serializedXml = serializedXml.replace(/<\/w:p><w:p>/g, '</w:p>\n<w:p>');

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