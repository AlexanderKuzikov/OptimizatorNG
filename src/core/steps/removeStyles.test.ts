import { removeStyles } from './removeStyles';

describe('removeStyles', () => {
  // Тест 1: Быстрый режим (удалить все)
  test('should remove all style tags when no preserved IDs are provided', () => {
    const xml = `
      <w:pPr><w:pStyle w:val="Style1"/><w:spacing/></w:pPr>
      <w:rPr><w:rStyle w:val="Style2"/></w:rPr>
    `;
    const expected = `
      <w:pPr><w:spacing/></w:pPr>
      <w:rPr></w:rPr>
    `;
    expect(removeStyles(xml, {})).toBe(expected);
  });

  // Тест 2: "Умный" режим (сохранить указанные)
  test('should preserve specified style IDs and remove others', () => {
    const xml = `
      <w:pPr><w:pStyle w:val="MyPreciousStyle"/></w:pPr>
      <w:rPr><w:rStyle w:val="UselessStyle"/></w:rPr>
    `;
    const expected = `
      <w:pPr><w:pStyle w:val="MyPreciousStyle"/></w:pPr>
      <w:rPr></w:rPr>
    `;
    const params = { preservedStyleIds: ['MyPreciousStyle'] };
    expect(removeStyles(xml, params)).toBe(expected);
  });

  // Тест 3: Чистый XML (ничего не должно сломаться)
  test('should not change the XML if no style tags are present', () => {
    const xml = `<w:pPr><w:spacing/></w:rPr>`;
    expect(removeStyles(xml, {})).toBe(xml);
  });
});