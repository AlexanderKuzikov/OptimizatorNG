import { replaceSpaceWithNbspAfterNumbering } from './replaceSpaceWithNbspAfterNumbering';

describe('replaceSpaceWithNbspAfterNumbering', () => {
  it('should replace space after numbering and add preserve', () => {
    const xml = `<w:t>1. Some text</w:t>`;
    const expectedXml = `<w:t xml:space="preserve">1.\u00A0Some text</w:t>`;
    const { xml: resultXml, changes } = replaceSpaceWithNbspAfterNumbering(xml, {});
    expect(resultXml).toBe(expectedXml);
    expect(changes).toBe(1);
  });

  it('should add xml:space="preserve" for leading spaces', () => {
    const xml = `<w:t> Text with leading space.</w:t>`;
    const expectedXml = `<w:t xml:space="preserve"> Text with leading space.</w:t>`;
    const { xml: resultXml, changes } = replaceSpaceWithNbspAfterNumbering(xml, {});
    expect(resultXml).toBe(expectedXml);
    expect(changes).toBe(1);
  });

  it('should process numbering even if preserve is already present', () => {
    const xml = `<w:t xml:space="preserve"> 1. Text </w:t>`;
    const expectedXml = `<w:t xml:space="preserve"> 1.\u00A0Text </w:t>`;
    const { xml: resultXml, changes } = replaceSpaceWithNbspAfterNumbering(xml, {});
    expect(resultXml).toBe(expectedXml);
    expect(changes).toBe(1);
  });

  it('should not change anything if not applicable', () => {
    const xml = `<w:t>Regular text without spaces.</w:t>`;
    const { xml: resultXml, changes } = replaceSpaceWithNbspAfterNumbering(xml, {});
    expect(resultXml).toBe(xml);
    expect(changes).toBe(0);
  });

  it('should handle empty input', () => {
    const { xml, changes } = replaceSpaceWithNbspAfterNumbering('', {});
    expect(xml).toBe('');
    expect(changes).toBe(0);
  });
});