"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const removeDuplicateSpaces_1 = require("./removeDuplicateSpaces");
describe('removeDuplicateSpaces', () => {
    test('should replace multiple spaces and count changes', () => {
        const xml = '<w:t>One  Two   Three</w:t>';
        const result = (0, removeDuplicateSpaces_1.removeDuplicateSpaces)(xml, {});
        expect(result.xml).toBe('<w:t>One Two Three</w:t>');
        expect(result.changes).toBe(2);
    });
    test('should return 0 changes if no duplicates are found', () => {
        const xml = '<w:t>One Two Three</w:t>';
        const result = (0, removeDuplicateSpaces_1.removeDuplicateSpaces)(xml, {});
        expect(result.xml).toBe(xml);
        expect(result.changes).toBe(0);
    });
});
