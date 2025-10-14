"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeConsecutiveRuns = mergeConsecutiveRuns;
const jsdom_1 = require("jsdom");
function getFormattingSignature(runNode) {
    if (!runNode)
        return '';
    let signatureParts = [];
    const rPrNode = runNode.getElementsByTagName('w:rPr')[0] || null;
    if (rPrNode) {
        const rPrChildren = Array.from(rPrNode.childNodes).filter((node) => node.nodeType === 1);
        for (const child of rPrChildren) {
            const tagName = child.nodeName.replace(/^w:/, '');
            let attrPart = '';
            const valAttr = child.getAttribute('w:val');
            if (valAttr !== null)
                attrPart += `[val:${valAttr}]`;
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
function mergeConsecutiveRuns(xml, params) {
    if (!xml || xml.trim() === '')
        return { xml: '', changes: 0 };
    let changes = 0;
    const dummyTag = 'dummy';
    const namespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const cleanXml = xml.replace(/<\?xml[^>]*\?>\s*/, '');
    const wrappedXml = `<${dummyTag} xmlns:w="${namespace}">${cleanXml}</${dummyTag}>`;
    const dom = new jsdom_1.JSDOM(wrappedXml, { contentType: 'application/xml' });
    const doc = dom.window.document;
    const paragraphs = Array.from(doc.getElementsByTagName('w:p'));
    for (const p of paragraphs) {
        let runs = Array.from(p.getElementsByTagName('w:r'));
        if (runs.length < 2)
            continue;
        let i = 0;
        while (i < runs.length - 1) {
            const currentRun = runs[i];
            const nextRun = runs[i + 1];
            if (currentRun.nextElementSibling !== nextRun) {
                i++;
                continue;
            }
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
                }
                else {
                    i++;
                }
            }
            else {
                i++;
            }
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
