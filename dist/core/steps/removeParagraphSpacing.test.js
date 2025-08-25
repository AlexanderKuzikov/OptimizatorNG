"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const removeParagraphSpacing_1 = require("./removeParagraphSpacing");
describe('removeParagraphSpacing', () => {
    test('should remove spacing tags and count changes', () => {
        const xml = `<w:pPr><w:spacing/></w:pPr><w:pPr><w:spacing/></w:pPr>`;
        const result = (0, removeParagraphSpacing_1.removeParagraphSpacing)(xml, {});
        expect(result.xml).toBe('<w:pPr></w:pPr><w:pPr></w:pPr>');
        expect(result.changes).toBe(2);
    });
    test('should return 0 changes if no spacing tags are present', () => {
        const xml = `<w:pPr></w:pPr>`;
        const result = (0, removeParagraphSpacing_1.removeParagraphSpacing)(xml, {});
        expect(result.xml).toBe(xml);
        expect(result.changes).toBe(0);
    });
});
