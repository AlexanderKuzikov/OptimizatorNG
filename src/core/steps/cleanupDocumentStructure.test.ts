import { cleanupDocumentStructure } from './cleanupDocumentStructure';

describe('cleanupDocumentStructure - Только новые регулярки', () => {
  const normalizeXmlForComparison = (xmlString: string) => {
    return xmlString.replace(/\s/g, '');
  };

  it('должен удалить параграф с w:pPr и только одним w:r с пробелом', () => {
    const inputXml = `
      <w:body>
        <w:p><w:pPr/><w:r><w:t> </w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:t>  </w:t></w:r></w:p>
        <w:p><w:pPr/><w:r><w:t>Visible</w:t></w:r></w:p>
      </w:body>
    `;
    const expectedXml = `
      <w:body>
        <w:p/>
        <w:p/>
        <w:p><w:pPr/><w:r><w:t>Visible</w:t></w:r></w:p>
      </w:body>
    `;
    const { xml: resultXml, changes } = cleanupDocumentStructure(inputXml, {});
    expect(normalizeXmlForComparison(resultXml)).toBe(normalizeXmlForComparison(expectedXml));
    expect(changes).toBe(2);
  });

  it('должен удалить параграф с w:pPr и только одним w:r с табуляцией', () => {
    const inputXml = `
      <w:body>
        <w:p><w:pPr/><w:r><w:tab/></w:r></w:p>
        <w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:tab/></w:r></w:p>
      </w:body>
    `;
    const expectedXml = `
      <w:body>
        <w:p/>
        <w:p/>
      </w:body>
    `;
    const { xml: resultXml, changes } = cleanupDocumentStructure(inputXml, {});
    expect(normalizeXmlForComparison(resultXml)).toBe(normalizeXmlForComparison(expectedXml));
    expect(changes).toBe(2);
  });
  
  // !!! Остальные тесты, которые проходили, будут здесь пропущены ради краткости
  // ...
  // it('должен удалить параграф с w:pPr и только одним w:r с разрывом строки', () => { ... });
  // it('должен удалить параграф с w:pPr и только одним самозакрывающимся w:r', () => { ... });
  // it('должен удалить параграф с w:pPr и только одним w:r с пустыми w:rPr и w:t', () => { ... });
  // it('не должен трогать параграфы с видимым текстом, даже если есть w:pPr', () => { ... });
  // it('должен обрабатывать пустой ввод', () => { ... });
});