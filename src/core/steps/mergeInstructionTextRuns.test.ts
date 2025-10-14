import { mergeInstructionTextRuns } from './mergeInstructionTextRuns';

describe('mergeInstructionTextRuns', () => {
  it('should merge two consecutive runs with instrText', () => {
    const xml = `<w:p><w:r><w:instrText> MERGEFIELD Field1 </w:instrText></w:r><w:r><w:instrText> \\* MERGEFORMAT </w:instrText></w:r></w:p>`;
    const expectedXml = `<w:p><w:r><w:instrText> MERGEFIELD Field1  \\* MERGEFORMAT </w:instrText></w:r></w:p>`;
    const { xml: resultXml, changes } = mergeInstructionTextRuns(xml, {});
    expect(resultXml).toBe(expectedXml);
    expect(changes).toBe(1);
  });

  it('should not merge if one run does not have instrText', () => {
    const xml = `<w:p><w:r><w:instrText>Instruction</w:instrText></w:r><w:r><w:t>Regular Text</w:t></w:r></w:p>`;
    const { xml: resultXml, changes } = mergeInstructionTextRuns(xml, {});
    expect(resultXml).toBe(xml);
    expect(changes).toBe(0);
  });

  it('should not merge non-consecutive instrText runs', () => {
    const xml = `<w:p><w:r><w:instrText>A</w:instrText></w:r><w:br/><w:r><w:instrText>B</w:instrText></w:r></w:p>`;
    const { xml: resultXml, changes } = mergeInstructionTextRuns(xml, {});
    expect(resultXml).toBe(xml);
    expect(changes).toBe(0);
  });

  it('should handle empty input', () => {
    const { xml, changes } = mergeInstructionTextRuns('', {});
    expect(xml).toBe('');
    expect(changes).toBe(0);
  });
});