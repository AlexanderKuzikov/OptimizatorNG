import { removeTextColor } from './removeTextColor';

describe('removeTextColor', () => {
    const params = { preservedColors: ["B3E7FB"] };

    test('should remove color tags and count changes', () => {
        const xml = `<w:rPr><w:color w:val="FF0000"/><w:color w:val="auto"/></w:rPr>`;
        const result = removeTextColor(xml, params);
        expect(result.xml).toBe('<w:rPr></w:rPr>');
        expect(result.changes).toBe(2);
    });

    test('should preserve specified color tags and count 0 changes for them', () => {
        const xml = `<w:rPr><w:color w:val="b3e7fb"/><w:color w:val="FF0000"/></w:rPr>`;
        const result = removeTextColor(xml, params);
        expect(result.xml).toBe('<w:rPr><w:color w:val="b3e7fb"/></w:rPr>');
        expect(result.changes).toBe(1);
    });

    test('should return 0 changes if no removable tags are found', () => {
        const xml = `<w:rPr><w:color w:val="B3E7FB"/></w:rPr>`;
        const result = removeTextColor(xml, params);
        expect(result.xml).toBe(xml);
        expect(result.changes).toBe(0);
    });
});