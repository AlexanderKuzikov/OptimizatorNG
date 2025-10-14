import { assimilateSpaceRuns } from './assimilateSpaceRuns';

describe('assimilateSpaceRuns', () => {
    it('should merge a simple space run into the previous run', () => {
        const xml = `<w:p><w:r><w:t>Hello</w:t></w:r><w:r><w:t> </w:t></w:r></w:p>`;
        const expectedXml = `<w:p><w:r><w:t>Hello </w:t></w:r></w:p>`;
        const { xml: resultXml, changes } = assimilateSpaceRuns(xml, {});
        expect(resultXml).toBe(expectedXml); // Сравниваем точно, без replace(/\s/g, '')
        expect(changes).toBe(1);
    });

    it('should not merge if the previous run has no text node', () => {
        const xml = `<w:p><w:r><w:br/></w:r><w:r><w:t> </w:t></w:r></w:p>`;
        const { xml: resultXml, changes } = assimilateSpaceRuns(xml, {});
        expect(resultXml).toBe(xml);
        expect(changes).toBe(0);
    });

    it('should handle multiple space runs', () => {
        const xml = `<w:p><w:r><w:t>A</w:t></w:r><w:r><w:t> </w:t></w:r><w:r><w:t>B</w:t></w:r><w:r><w:t> </w:t></w:r></w:p>`;
        const expectedXml = `<w:p><w:r><w:t>A </w:t></w:r><w:r><w:t>B </w:t></w:r></w:p>`;
        const { xml: resultXml, changes } = assimilateSpaceRuns(xml, {});
        expect(resultXml).toBe(expectedXml);
        expect(changes).toBe(2);
    });

    it('should do nothing if there are no space runs', () => {
        const xml = `<w:p><w:r><w:t>Hello</w:t></w:r><w:r><w:t>World</w:t></w:r></w:p>`;
        const { xml: resultXml, changes } = assimilateSpaceRuns(xml, {});
        expect(resultXml).toBe(xml);
        expect(changes).toBe(0);
    });

    it('should handle empty input', () => {
        const { xml, changes } = assimilateSpaceRuns('', {});
        expect(xml).toBe('');
        expect(changes).toBe(0);
    });
});