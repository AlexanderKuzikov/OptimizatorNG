import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import is from '@sindresorhus/is';

interface StepResult {
  xml: string;
  changes: number;
}

/**
 * Cleans up paragraph properties in two ways:
 * 1. Removes run properties (<w:rPr>) from within valid paragraph properties (<w:pPr>).
 * 2. Removes any <w:pPr> elements that are not direct children of a <w:p> element ("orphans").
 *
 * @param xml The XML content of the document as a string.
 * @param params Unused for this step.
 * @returns An object containing the optimized XML and the number of changes made.
 */
export function cleanupParaProps(xml: string, params: any): StepResult {
  if (is.emptyStringOrWhitespace(xml)) {
    return { xml: '', changes: 0 };
  }

  const parser = new DOMParser();
  // A dummy root is essential for parentNode checks to function reliably.
  const doc = parser.parseFromString(`<dummy>${xml}</dummy>`, 'application/xml');
  let changes = 0;

  const allPPrs = Array.from(doc.getElementsByTagName('w:pPr'));

  for (const pPr of allPPrs) {
    const parent = pPr.parentNode;

    // Case 1: Handle "Orphaned" <w:pPr>.
    // If its parent is not a <w:p> tag, it must be removed.
    if (!parent || parent.nodeName !== 'w:p') {
      if (parent) {
        parent.removeChild(pPr);
        changes++;
      }
      continue; // The node is gone, so we move to the next.
    }

    // Case 2: Handle valid <w:pPr> containing <w:rPr> (paragraph mark formatting).
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
    // Strip the dummy tags to get the clean inner content.
    const finalXml = fullXml.substring('<dummy>'.length, fullXml.length - '</dummy>'.length);
    return { xml: finalXml, changes };
  }

  return { xml, changes: 0 };
}