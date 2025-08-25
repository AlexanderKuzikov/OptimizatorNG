"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const removeIndentation_1 = require("./removeIndentation");
describe('removeIndentation', () => {
    test('should remove indentation tags and count changes', () => {
        const xml = `<w:pPr><w:ind/></w:pPr><w:pPr><w:ind/></w:pPr>`;
        const result = (0, removeIndentation_1.removeIndentation)(xml, {});
        expect(result.xml).toBe('<w:pPr></w:pPr><w:pPr></w:pPr>');
        expect(result.changes).toBe(2);
    });
    test('should return 0 changes if no indentation tags are present', () => {
        const xml = `<w:pPr></w:pPr>`;
        const result = (0, removeIndentation_1.removeIndentation)(xml, {});
        expect(result.xml).toBe(xml);
        expect(result.changes).toBe(0);
    });
});
