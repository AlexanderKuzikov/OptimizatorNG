import { mergeInstructionTextRuns } from './mergeInstructionTextRuns';

describe('mergeInstructionTextRuns', () => {
  it('should merge a long sequence of instrText runs into a single run', () => {
    // This XML is unformatted in the actual file, as requested.
    const input = '<w:p>' +
      '<w:r><w:instrText>FluidMarker</w:instrText></w:r>' +
      '<w:r><w:instrText> </w:instrText></w:r>' +
      '<w:r><w:instrText>Expression</w:instrText></w:r>' +
      '<w:r><w:instrText> 0</w:instrText></w:r>' +
      '<w:r><w:instrText>L</w:instrText></w:r>' +
      '<w:r><w:instrText>/</w:instrText></w:r>' +
      '<w:r><w:instrText>RgNC</w:instrText></w:r>' +
      '<w:r><w:instrText>1</w:instrText></w:r>' +
      '<w:r><w:instrText>0</w:instrText></w:r>' +
      '<w:r><w:instrText>LTRgdGC</w:instrText></w:r>' +
      '<w:r><w:instrText>0</w:instrText></w:r>' +
      '<w:r><w:instrText>LDQstC</w:instrText></w:r>' +
      '<w:r><w:instrText>40</w:instrText></w:r>' +
      '<w:r><w:instrText>YLQtdC</w:instrText></w:r>' +
      '<w:r><w:instrText>70</w:instrText></w:r>' +
      '<w:r><w:instrText>YwuZW</w:instrText></w:r>' +
      '<w:r><w:instrText>1</w:instrText></w:r>' +
      '<w:r><w:instrText>haWw</w:instrText></w:r>' +
      '<w:r><w:instrText>=</w:instrText></w:r>' +
      '</w:p>';

    const expectedText = 'FluidMarker Expression 0L/RgNC10LTRgdGC0LDQstC40YLQtdC70YwuZW1haWw=';
    const expectedXml = `<w:p><w:r><w:instrText>${expectedText}</w:instrText></w:r></w:p>`;
    
    const result = mergeInstructionTextRuns(input, {});
    
    // There are 19 runs, so there should be 18 merges.
    expect(result.changes).toBe(18);
    expect(result.xml).toBe(expectedXml);
  });

  it('should NOT merge regular text runs (<w:t>)', () => {
    const input = '<w:p>' +
      '<w:r><w:t>Hello </w:t></w:r>' +
      '<w:r><w:t>World</w:t></w:r>' +
      '</w:p>';
      
    const result = mergeInstructionTextRuns(input, {});
    expect(result.changes).toBe(0);
    expect(result.xml).toBe(input);
  });

  it('should NOT merge a mix of instrText and regular text runs', () => {
    const input = '<w:p>' +
      '<w:r><w:instrText>Instruction</w:instrText></w:r>' +
      '<w:r><w:t>Regular Text</w:t></w:r>' +
      '<w:r><w:instrText> More Instruction</w:instrText></w:r>' +
      '</w:p>';

    const result = mergeInstructionTextRuns(input, {});
    expect(result.changes).toBe(0);
    expect(result.xml).toBe(input);
  });
  
  it('should NOT merge non-consecutive instrText runs', () => {
    const input = '<w:p>' +
      '<w:r><w:instrText>First</w:instrText></w:r>' +
      '<w:proofErr w:type="spellStart"/>' +
      '<w:r><w:instrText>Second</w:instrText></w:r>' +
      '</w:p>';
      
    const result = mergeInstructionTextRuns(input, {});
    expect(result.changes).toBe(0);
    expect(result.xml).toBe(input);
  });

  it('should return 0 changes for empty input', () => {
    const result = mergeInstructionTextRuns('', {});
    expect(result.changes).toBe(0);
    expect(result.xml).toBe('');
  });
});