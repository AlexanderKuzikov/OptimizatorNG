import { cleanupParaProps } from './cleanupParaProps';

describe('cleanupParaProps', () => {
  it('should remove <w:rPr> from within a valid <w:pPr>', () => {
    const xml = `<w:p><w:pPr><w:pStyle w:val="Normal"/><w:rPr><w:lang w:val="en-US"/></w:rPr></w:pPr><w:r><w:t>Some text.</w:t></w:r></w:p>`;
    const expectedXml = `<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:t>Some text.</w:t></w:r></w:p>`;
    const { xml: resultXml, changes } = cleanupParaProps(xml, {});
    expect(resultXml).toBe(expectedXml);
    expect(changes).toBe(1);
  });

  it('should remove an orphaned <w:pPr> that is not a child of <w:p>', () => {
    const xml = `<w:body><w:pPr><w:spacing w:after="0"/></w:pPr><w:p><w:r><w:t>Some text.</w:t></w:r></w:p></w:body>`;
    const expectedXml = `<w:body><w:p><w:r><w:t>Some text.</w:t></w:r></w:p></w:body>`;
    const { xml: resultXml, changes } = cleanupParaProps(xml, {});
    expect(resultXml).toBe(expectedXml);
    expect(changes).toBe(1);
  });

  it('should handle multiple issues in one go', () => {
    const xml = `<w:tbl><w:pPr><w:jc w:val="center"/></w:pPr><w:tr><w:tc><w:p><w:pPr><w:rPr><w:b/></w:rPr></w:pPr><w:r><w:t>Cell text</w:t></w:r></w:p></w:tc></w:tr></w:tbl>`;
    // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
    // Ожидаем <w:pPr/>, как возвращает функция
    const expectedXml = `<w:tbl><w:tr><w:tc><w:p><w:pPr/><w:r><w:t>Cell text</w:t></w:r></w:p></w:tc></w:tr></w:tbl>`;
    const { xml: resultXml, changes } = cleanupParaProps(xml, {});
    expect(resultXml).toBe(expectedXml);
    expect(changes).toBe(2);
  });

  it('should do nothing if XML is clean', () => {
    const xml = `<w:p><w:pPr><w:ind w:left="720"/></w:pPr><w:r><w:t>Clean paragraph.</w:t></w:r></w:p>`;
    const { xml: resultXml, changes } = cleanupParaProps(xml, {});
    expect(resultXml).toBe(xml);
    expect(changes).toBe(0);
  });

  it('should handle empty input', () => {
    const { xml, changes } = cleanupParaProps('', {});
    expect(xml).toBe('');
    expect(changes).toBe(0);
  });
});