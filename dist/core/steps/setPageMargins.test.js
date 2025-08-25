"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setPageMargins_1 = require("./setPageMargins");
describe('setPageMargins', () => {
    const params = { width: 1, height: 1, top: 1, right: 1, bottom: 1, left: 1, gutter: 0 };
    const expectedXml = '<w:sectPr><w:pgSz w:w="1" w:h="1" w:orient="portrait" w:code="9"/><w:pgMar w:top="1" w:right="1" w:bottom="1" w:left="1" w:gutter="0"/></w:sectPr>';
    test('should replace existing block and count 1 change', () => {
        const xml = `<w:body><w:sectPr>old</w:sectPr></w:body>`;
        const result = (0, setPageMargins_1.setPageMargins)(xml, params);
        expect(result.xml).toBe(`<w:body>${expectedXml}</w:body>`);
        expect(result.changes).toBe(1);
    });
    test('should add new block and count 1 change', () => {
        const xml = `<w:body></w:body>`;
        const result = (0, setPageMargins_1.setPageMargins)(xml, params);
        expect(result.xml).toBe(`<w:body>${expectedXml}</w:body>`);
        expect(result.changes).toBe(1);
    });
    test('should do nothing and count 0 changes if block is identical', () => {
        const xml = `<w:body>${expectedXml}</w:body>`;
        const result = (0, setPageMargins_1.setPageMargins)(xml, params);
        expect(result.xml).toBe(xml);
        expect(result.changes).toBe(0);
    });
});
