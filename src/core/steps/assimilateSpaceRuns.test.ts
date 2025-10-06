import { assimilateSpaceRuns } from './assimilateSpaceRuns';

describe('assimilateSpaceRuns', () => {
  // ... (предыдущие тесты остаются без изменений)

  it('should merge a space-only run that also has formatting', () => {
    const input =
      '<w:p>' +
      '<w:r><w:t>3.</w:t></w:r>' +
      '<w:r><w:rPr><w:b/></w:rPr><w:t> </w:t></w:r>' + // This is the new case
      '</w:p>';

    const expectedXml = '<w:p><w:r><w:t>3. </w:t></w:r></w:p>';
      
    const result = assimilateSpaceRuns(input, {});
    expect(result.changes).toBe(1);
    expect(result.xml).toBe(expectedXml);
  });
});