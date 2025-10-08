import { mergeConsecutiveRuns } from './mergeConsecutiveRuns';

describe('mergeConsecutiveRuns', () => {
  it('should merge two consecutive runs with identical formatting', () => {
    const xml = `
      <w:p>
        <w:r><w:rPr><w:b/></w:rPr><w:t>Hello </w:t></w:r>
        <w:r><w:rPr><w:b/></w:rPr><w:t>World</w:t></w:r>
      </w:p>
    `;
    const expectedXml = `
      <w:p>
        <w:r><w:rPr><w:b/></w:rPr><w:t>Hello World</w:t></w:r>
      </w:p>
    `;
    const { xml: resultXml, changes } = mergeConsecutiveRuns(xml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(expectedXml.replace(/\s/g, ''));
    expect(changes).toBe(1);
  });

  it('should not merge runs with different formatting', () => {
    const xml = `
      <w:p>
        <w:r><w:rPr><w:b/></w:rPr><w:t>Bold</w:t></w:r>
        <w:r><w:rPr><w:i/></w:rPr><w:t>Italic</w:t></w:r>
      </w:p>
    `;
    const { xml: resultXml, changes } = mergeConsecutiveRuns(xml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(xml.replace(/\s/g, ''));
    expect(changes).toBe(0);
  });

  it('should merge multiple consecutive runs with identical formatting', () => {
    const xml = `
      <w:p>
        <w:r><w:t>Part1</w:t></w:r>
        <w:r><w:t>Part2</w:t></w:r>
        <w:r><w:t>Part3</w:t></w:r>
      </w:p>
    `;
    const expectedXml = `
      <w:p>
        <w:r><w:t>Part1Part2Part3</w:t></w:r>
      </w:p>
    `;
    const { xml: resultXml, changes } = mergeConsecutiveRuns(xml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(expectedXml.replace(/\s/g, ''));
    expect(changes).toBe(2);
  });

  it('should not merge non-consecutive runs', () => {
    const xml = `
      <w:p>
        <w:r><w:t>One</w:t></w:r>
        <w:r><w:t xml:space="preserve"> </w:t></w:r>
        <w:r><w:t>Two</w:t></w:r>
      </w:p>
    `;
    const { xml: resultXml, changes } = mergeConsecutiveRuns(xml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(xml.replace(/\s/g, ''));
    expect(changes).toBe(0);
  });

  it('should handle runs where one has no text', () => {
    const xml = `
      <w:p>
        <w:r><w:rPr><w:b/></w:rPr><w:t>Hello</w:t></w:r>
        <w:r><w:rPr><w:b/></w:rPr></w:r>
        <w:r><w:rPr><w:b/></w:rPr><w:t>World</w:t></w:r>
      </w:p>
    `;
    const { xml: resultXml, changes } = mergeConsecutiveRuns(xml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(xml.replace(/\s/g, ''));
    expect(changes).toBe(0);
  });

  it('should correctly handle formatting signatures with attributes', () => {
    const xml = `
      <w:p>
        <w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>Red</w:t></w:r>
        <w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t> text</w:t></w:r>
        <w:r><w:rPr><w:color w:val="0000FF"/></w:rPr><w:t>Blue</w:t></w:r>
      </w:p>
    `;
    const expectedXml = `
      <w:p>
        <w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>Red text</w:t></w:r>
        <w:r><w:rPr><w:color w:val="0000FF"/></w:rPr><w:t>Blue</w:t></w:r>
      </w:p>
    `;
    const { xml: resultXml, changes } = mergeConsecutiveRuns(xml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(expectedXml.replace(/\s/g, ''));
    expect(changes).toBe(1);
  });
  
  it('should handle empty input', () => {
    const { xml, changes } = mergeConsecutiveRuns('', {});
    expect(xml).toBe('');
    expect(changes).toBe(0);
  });
});