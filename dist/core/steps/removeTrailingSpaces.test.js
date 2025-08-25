"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const removeTrailingSpaces_1 = require("./removeTrailingSpaces");
describe('removeTrailingSpaces', () => {
    test('should remove trailing spaces and count changes', () => {
        const xml = `<w:t>Text </w:t><w:t>More text  </w:t>`;
        const result = (0, removeTrailingSpaces_1.removeTrailingSpaces)(xml, {});
        expect(result.xml).toBe('<w:t>Text</w:t><w:t>More text</w:t>');
        expect(result.changes).toBe(2);
    });
    test('should return 0 changes if no trailing spaces are present', () => {
        const xml = `<w:t>Text</w:t>`;
        const result = (0, removeTrailingSpaces_1.removeTrailingSpaces)(xml, {});
        expect(result.xml).toBe(xml);
        expect(result.changes).toBe(0);
    });
});
