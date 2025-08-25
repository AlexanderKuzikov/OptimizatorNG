import { removeFonts } from './removeFonts';

describe('removeFonts', () => {
    test('should remove font tags and count changes', () => {
        const xml = `<w:rPr><w:rFonts/></w:rPr><w:rPr><w:rFonts/></w:rPr>`;
        const result = removeFonts(xml, {});
        expect(result.xml).toBe('<w:rPr></w:rPr><w:rPr></w:rPr>');
        expect(result.changes).toBe(2);
    });

    test('should return 0 changes if no font tags are present', () => {
        const xml = `<w:rPr></w:rPr>`;
        const result = removeFonts(xml, {});
        expect(result.xml).toBe(xml);
        expect(result.changes).toBe(0);
    });
});