import { assimilateSpaceRuns } from './assimilateSpaceRuns';

describe('assimilateSpaceRuns', () => {
  it('should merge a single space run into the preceding text run', () => {
    const xml = `
      <w:p>
        <w:r><w:t>Hello</w:t></w:r>
        <w:r><w:t> </w:t></w:r>
        <w:r><w:t>World</w:t></w:r>
      </w:p>
    `;
    const expectedXml = `
      <w:p>
        <w:r><w:t>Hello </w:t></w:r>
        
        <w:r><w:t>World</w:t></w:r>
      </w:p>
    `;
    const { xml: resultXml, changes } = assimilateSpaceRuns(xml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(expectedXml.replace(/\s/g, ''));
    expect(changes).toBe(1);
  });

  it('should not merge if the preceding run has no text', () => {
    const xml = `
      <w:p>
        <w:r><w:rPr/></w:r>
        <w:r><w:t> </w:t></w:r>
        <w:r><w:t>World</w:t></w:r>
      </w:p>
    `;
    const { xml: resultXml, changes } = assimilateSpaceRuns(xml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(xml.replace(/\s/g, ''));
    expect(changes).toBe(0);
  });

  it('should handle multiple space runs correctly', () => {
    const xml = `
      <w:p>
        <w:r><w:t>One</w:t></w:r>
        <w:r><w:t> </w:t></w:r>
        <w:r><w:t>Two</w:t></w:r>
        <w:r><w:t> </w:t></w:r>
        <w:r><w:t>Three</w:t></w:r>
      </w:p>
    `;
    const expectedXml = `
      <w:p>
        <w:r><w:t>One </w:t></w:r>
        
        <w:r><w:t>Two </w:t></w:r>
        
        <w:r><w:t>Three</w:t></w:r>
      </w:p>
    `;
    const { xml: resultXml, changes } = assimilateSpaceRuns(xml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(expectedXml.replace(/\s/g, ''));
    expect(changes).toBe(2);
  });

  it('should return unchanged XML if no space runs are found', () => {
    const xml = `<w:p><w:r><w:t>HelloWorld</w:t></w:r></w:p>`;
    const { xml: resultXml, changes } = assimilateSpaceRuns(xml, {});
    expect(resultXml).toBe(xml);
    expect(changes).toBe(0);
  });

  it('should handle empty input', () => {
    const { xml, changes } = assimilateSpaceRuns('', {});
    expect(xml).toBe('');
    expect(changes).toBe(0);
  });
});