import { mergeInstructionTextRuns } from './mergeInstructionTextRuns';

describe('mergeInstructionTextRuns', () => {
  it('should merge two consecutive runs with instrText', () => {
    const xml = `
      <w:p>
        <w:r><w:instrText> MERGEFIELD Field1 </w:instrText></w:r>
        <w:r><w:instrText> \\* MERGEFORMAT </w:instrText></w:r>
      </w:p>
    `;
    const expectedXml = `
      <w:p>
        <w:r><w:instrText> MERGEFIELD Field1  \\* MERGEFORMAT </w:instrText></w:r>
      </w:p>
    `;
    const { xml: resultXml, changes } = mergeInstructionTextRuns(xml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(expectedXml.replace(/\s/g, ''));
    expect(changes).toBe(1);
  });

  it('should merge three consecutive instrText runs', () => {
    const xml = `
      <w:p>
        <w:r><w:instrText>A</w:instrText></w:r>
        <w:r><w:instrText>B</w:instrText></w:r>
        <w:r><w:instrText>C</w:instrText></w:r>
      </w:p>
    `;
    const expectedXml = `
      <w:p>
        <w:r><w:instrText>ABC</w:instrText></w:r>
      </w:p>
    `;
    const { xml: resultXml, changes } = mergeInstructionTextRuns(xml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(expectedXml.replace(/\s/g, ''));
    expect(changes).toBe(2);
  });

  it('should not merge if one run does not have instrText', () => {
    const xml = `
      <w:p>
        <w:r><w:instrText>Instruction</w:instrText></w:r>
        <w:r><w:t>Regular Text</w:t></w:r>
      </w:p>
    `;
    const { xml: resultXml, changes } = mergeInstructionTextRuns(xml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(xml.replace(/\s/g, ''));
    expect(changes).toBe(0);
  });

  it('should not merge non-consecutive instrText runs', () => {
    const xml = `
      <w:p>
        <w:r><w:instrText>A</w:instrText></w:r>
        <w:r><w:t> </w:t></w:r>
        <w:r><w:instrText>B</w:instrText></w:r>
      </w:p>
    `;
    const { xml: resultXml, changes } = mergeInstructionTextRuns(xml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(xml.replace(/\s/g, ''));
    expect(changes).toBe(0);
  });

  it('should handle complex paragraph with mixed content', () => {
    const xml = `
      <w:p>
        <w:r><w:t>Some text</w:t></w:r>
        <w:r><w:instrText> START </w:instrText></w:r>
        <w:r><w:instrText> OF </w:instrText></w:r>
        <w:r><w:instrText> FIELD </w:instrText></w:r>
        <w:r><w:t>and other text</w:t></w:r>
      </w:p>
    `;
    const expectedXml = `
      <w:p>
        <w:r><w:t>Some text</w:t></w:r>
        <w:r><w:instrText> START  OF  FIELD </w:instrText></w:r>
        <w:r><w:t>and other text</w:t></w:r>
      </w:p>
    `;
    const { xml: resultXml, changes } = mergeInstructionTextRuns(xml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(expectedXml.replace(/\s/g, ''));
    expect(changes).toBe(2);
  });

  it('should handle empty input', () => {
    const { xml, changes } = mergeInstructionTextRuns('', {});
    expect(xml).toBe('');
    expect(changes).toBe(0);
  });
});