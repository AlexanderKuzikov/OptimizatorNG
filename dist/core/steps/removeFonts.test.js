"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const removeFonts_1 = require("./removeFonts");
describe('removeFonts', () => {
    test('should remove font tags and count changes', () => {
        const xml = `<w:rPr><w:rFonts/></w:rPr><w:rPr><w:rFonts/></w:rPr>`;
        const result = (0, removeFonts_1.removeFonts)(xml, {});
        expect(result.xml).toBe('<w:rPr></w:rPr><w:rPr></w:rPr>');
        expect(result.changes).toBe(2);
    });
    test('should return 0 changes if no font tags are present', () => {
        const xml = `<w:rPr></w:rPr>`;
        const result = (0, removeFonts_1.removeFonts)(xml, {});
        expect(result.xml).toBe(xml);
        expect(result.changes).toBe(0);
    });
});
