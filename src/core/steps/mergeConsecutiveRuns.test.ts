import { mergeConsecutiveRuns } from './mergeConsecutiveRuns';

describe('mergeConsecutiveRuns', () => {
  it('should merge two consecutive runs and report 1 change', () => {
    const input =
      '<w:p>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>Hello </w:t></w:r>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>World!</w:t></w:r>' +
      '</w:p>';
    const expectedXml =
      '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Hello World!</w:t></w:r></w:p>';
    
    const result = mergeConsecutiveRuns(input, {});
    expect(result.xml).toBe(expectedXml);
    expect(result.changes).toBe(1);
  });

  it('should NOT merge runs with different formatting and report 0 changes', () => {
    const input =
      '<w:p>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>Bold</w:t></w:r>' +
      '<w:r><w:rPr><w:i/></w:rPr><w:t> Italic</w:t></w:r>' +
      '</w:p>';
    
    const result = mergeConsecutiveRuns(input, {});
    expect(result.xml).toBe(input);
    expect(result.changes).toBe(0);
  });

  it('should merge multiple runs and report correct number of changes (2)', () => {
    const input =
      '<w:p>' +
      '<w:r><w:rPr><w:i/></w:rPr><w:t>One</w:t></w:r>' +
      '<w:r><w:rPr><w:i/></w:rPr><w:t> Two</w:t></w:r>' +
      '<w:r><w:rPr><w:i/></w:rPr><w:t> Three</w:t></w:r>' +
      '</w:p>';
    const expectedXml =
      '<w:p><w:r><w:rPr><w:i/></w:rPr><w:t>One Two Three</w:t></w:r></w:p>';

    const result = mergeConsecutiveRuns(input, {});
    expect(result.xml).toBe(expectedXml);
    expect(result.changes).toBe(2); // One->Two is 1 merge, (One+Two)->Three is 2nd merge
  });
  
  it('should merge runs with reordered properties and report 1 change', () => {
    const input =
      '<w:p>' +
      '<w:r><w:rPr><w:b/><w:i/></w:rPr><w:t>First</w:t></w:r>' +
      '<w:r><w:rPr><w:i/><w:b/></w:rPr><w:t> Second</w:t></w:r>' +
      '</w:p>';

    const result = mergeConsecutiveRuns(input, {});
    expect(result.changes).toBe(1);
    expect(result.xml).toContain('>First Second</w:t>');
  });

  it('should return 0 changes for empty or whitespace input', () => {
    expect(mergeConsecutiveRuns('', {}).changes).toBe(0);
    expect(mergeConsecutiveRuns('   ', {}).changes).toBe(0);
  });

  it('should return 0 changes if no merges are possible', () => {
    const input =
      '<w:p><w:r><w:t>A</w:t></w:r></w:p>' +
      '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>B</w:t></w:r></w:p>';
    
    const result = mergeConsecutiveRuns(input, {});
    expect(result.xml).toBe(input);
    expect(result.changes).toBe(0);
  });

  it('should not add xmlns:w to the output xml', () => {
    const input =
      '<w:p>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>Hello </w:t></w:r>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t>World!</w:t></w:r>' +
      '</w:p>';
    const result = mergeConsecutiveRuns(input, {});
    expect(result.xml).not.toContain('xmlns:w');
  });
});