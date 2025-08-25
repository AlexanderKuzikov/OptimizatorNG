import { removeStyles } from './removeStyles';

describe('removeStyles', () => {
    test('should remove style tags and count changes', () => {
        const xml = `<w:pPr><w:pStyle w:val="1"/><w:pStyle w:val="2"/></w:pPr>`;
        const result = removeStyles(xml, {});
        expect(result.xml).toBe('<w:pPr></w:pPr>');
        expect(result.changes).toBe(2);
    });

    test('should return 0 changes if no styles are present', () => {
        const xml = `<w:pPr></w:pPr>`;
        const result = removeStyles(xml, {});
        expect(result.xml).toBe(xml);
        expect(result.changes).toBe(0);
    });
});