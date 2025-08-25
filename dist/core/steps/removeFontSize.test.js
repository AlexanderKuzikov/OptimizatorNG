"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const removeFontSize_1 = require("./removeFontSize");
describe('removeFontSize', () => {
    test('should remove font size tags and count changes', () => {
        const xml = `<w:rPr><w:sz/></w:rPr><w:rPr><w:sz/></w:rPr>`;
        const result = (0, removeFontSize_1.removeFontSize)(xml, {});
        expect(result.xml).toBe('<w:rPr></w:rPr><w:rPr></w:rPr>');
        expect(result.changes).toBe(2);
    });
    test('should return 0 changes if no font size tags are present', () => {
        const xml = `<w:rPr></w:rPr>`;
        const result = (0, removeFontSize_1.removeFontSize)(xml, {});
        expect(result.xml).toBe(xml);
        expect(result.changes).toBe(0);
    });
});
