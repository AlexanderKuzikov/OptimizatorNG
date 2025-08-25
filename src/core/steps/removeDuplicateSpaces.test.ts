import { removeDuplicateSpaces } from './removeDuplicateSpaces';

describe('removeDuplicateSpaces', () => {
    test('should replace multiple spaces and count changes', () => {
        const xml = '<w:t>One  Two   Three</w:t>';
        const result = removeDuplicateSpaces(xml, {});
        expect(result.xml).toBe('<w:t>One Two Three</w:t>');
        expect(result.changes).toBe(2);
    });

    test('should return 0 changes if no duplicates are found', () => {
        const xml = '<w:t>One Two Three</w:t>';
        const result = removeDuplicateSpaces(xml, {});
        expect(result.xml).toBe(xml);
        expect(result.changes).toBe(0);
    });
});