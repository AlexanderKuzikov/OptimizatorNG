import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import is from '@sindresorhus/is';

interface StepResult {
  xml: string;
  changes: number;
}

/**
 * Merges consecutive <w:r> elements that contain <w:instrText> tags.
 * This is intended to clean up field codes (e.g., FluidMarker) that Word often splits into many runs.
 *
 * @param xml - The XML content of the document as a string.
 * @param params - Unused for this step.
 * @returns An object containing the optimized XML and the number of merges performed.
 */
export function mergeInstructionTextRuns(xml: string, params: any): StepResult {
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

      // We only merge if the runs are direct siblings.
      if (currentRun.nextSibling !== nextRun) {
        i++;
        continue;
      }

      const instrTextCurrent = currentRun.getElementsByTagName('w:instrText')[0];
      const instrTextNext = nextRun.getElementsByTagName('w:instrText')[0];
      
      // We only proceed if BOTH runs contain an <w:instrText> tag.
      // We assume instruction text runs have no meaningful formatting to compare.
      if (instrTextCurrent && instrTextNext) {
        const currentText = instrTextCurrent.textContent || '';
        const nextText = instrTextNext.textContent || '';
        instrTextCurrent.textContent = currentText + nextText;
        
        p.removeChild(nextRun);
        changes++;
        runs.splice(i + 1, 1);
        // Do not increment 'i' to allow merging with the next run in the sequence.
      } else {
        // If not a merge candidate, move to the next run.
        i++;
      }
    }
  }

  // If we made changes, serialize the document and strip the dummy wrapper.
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

  // If no changes were made, return the original XML.
  return { xml, changes: 0 };
}