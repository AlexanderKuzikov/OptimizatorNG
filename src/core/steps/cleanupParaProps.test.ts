import { cleanupParaProps } from './cleanupParaProps';

describe('cleanupParaProps', () => {
  it('should remove rPr from within a valid pPr', () => {
    const input = '<w:p><w:pPr><w:rPr><w:b/></w:rPr></w:pPr></w:p>';
    const expected = '<w:p><w:pPr/></w:p>';
    const result = cleanupParaProps(input, {});
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(1);
  });

  it('should remove an orphaned pPr block that is not inside a w:p', () => {
    const input = '<w:pPr><w:rPr><w:b/></w:rPr></w:pPr><w:p>text</w:p>';
    const expected = '<w:p>text</w:p>';
    const result = cleanupParaProps(input, {});
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(1);
  });
  
  it('should handle both orphaned pPr and nested rPr in a single run', () => {
    const input = '<w:pPr>orphan</w:pPr><w:p><w:pPr><w:rPr>valid_nested</w:rPr></w:pPr></w:p>';
    const expected = '<w:p><w:pPr/></w:p>';
    const result = cleanupParaProps(input, {});
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(2);
  });

  it('should not affect regular rPr in text runs', () => {
    const input = '<w:p><w:r><w:rPr><w:b/></w:rPr></w:r></w:p>';
    const result = cleanupParaProps(input, {});
    expect(result.changes).toBe(0);
    expect(result.xml).toBe(input);
  });

  it('should return 0 changes for clean xml', () => {
    const input = '<w:p><w:pPr></w:pPr><w:r><w:t>text</w:t></w:r></w:p>';
    const result = cleanupParaProps(input, {});
    expect(result.changes).toBe(0);
  });
});