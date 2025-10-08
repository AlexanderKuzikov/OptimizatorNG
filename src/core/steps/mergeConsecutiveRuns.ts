import { JSDOM } from 'jsdom';

interface StepResult {
  xml: string;
  changes: number;
}

function getFormattingSignature(runNode: Element | null): string {
  if (!runNode) return '';
  let signatureParts: string[] = [];
  const rPrNode = runNode.getElementsByTagName('w:rPr')[0] || null;
  if (rPrNode) {
    const rPrChildren = Array.from(rPrNode.childNodes).filter((node): node is Element => node.nodeType === 1);
    for (const child of rPrChildren) {
      const tagName = child.nodeName.replace(/^w:/, '');
      let attrPart = '';
      const valAttr = child.getAttribute('w:val');
      if (valAttr !== null) attrPart += `[val:${valAttr}]`;
      signatureParts.push(`${tagName}${attrPart}`);
    }
  }
  const tNode = runNode.getElementsByTagName('w:t')[0] || null;
  if (tNode && tNode.getAttribute('xml:space') === 'preserve') {
    signatureParts.push('t[xml:space:preserve]');
  }
  signatureParts.sort();
  return signatureParts.join(';');
}

export function mergeConsecutiveRuns(xml: string, params: any): StepResult {
  if (!xml || xml.trim() === '') return { xml: '', changes: 0 };
  let changes = 0;
  const rootTag = 'customroot';
  const namespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const wrappedXml = `<${rootTag} xmlns:w="${namespace}">${xml}</${rootTag}>`;
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
      const sigCurrent = getFormattingSignature(currentRun);
      const sigNext = getFormattingSignature(nextRun);
      if (sigCurrent === sigNext) {
        const textNodeCurrent = currentRun.getElementsByTagName('w:t')[0];
        const textNodeNext = nextRun.getElementsByTagName('w:t')[0];
        if (textNodeCurrent && textNodeNext) {
          textNodeCurrent.textContent = (textNodeCurrent.textContent || '') + (textNodeNext.textContent || '');
          p.removeChild(nextRun);
          changes++;
          runs.splice(i + 1, 1);
        } else { i++; }
      } else { i++; }
    }
  }

  if (changes > 0) {
    const serializer = new dom.window.XMLSerializer();
    let serializedXml = serializer.serializeToString(doc.documentElement);
    const startTag = `<${rootTag} xmlns:w="${namespace}">`;
    const endTag = `</${rootTag}>`;
    if (serializedXml.startsWith(startTag) && serializedXml.endsWith(endTag)) {
      const finalXml = serializedXml.substring(startTag.length, serializedXml.length - endTag.length);
      return { xml: finalXml, changes };
    }
    return { xml, changes: 0 };
  }
  return { xml, changes: 0 };
}