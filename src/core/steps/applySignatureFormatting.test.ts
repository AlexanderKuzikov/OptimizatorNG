import { applySignatureFormatting } from './applySignatureFormatting';

describe('applySignatureFormatting', () => {
  const WORD_NAMESPACE = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const STYLE_TABULAR1 = 'Tabular1';
  const STYLE_TABULAR2 = 'Tabular2';

  const normalizeXmlForComparison = (xmlString: string) => {
    return xmlString.replace(/\s/g, '');
  };

  it('должен изменить стиль с Tabular1 на Tabular2 и удалить первую табуляцию, если есть "ФИО"', () => {
    const inputXml = `
      <w:body>
        <w:p><w:pPr><w:pStyle w:val="${STYLE_TABULAR1}"/></w:pPr><w:r><w:tab/></w:r><w:r><w:t>Иванов ФИО Петр</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>Подпись</w:t></w:r></w:p>
        <w:p><w:pPr><w:pStyle w:val="${STYLE_TABULAR1}"/></w:pPr><w:r><w:tab/></w:r><w:r><w:t>Текст без упоминания</w:t></w:r></w:p>
      </w:body>
    `;

    const expectedXml = `
      <w:body>
        <w:p><w:pPr><w:pStyle w:val="${STYLE_TABULAR2}"/></w:pPr><w:r><w:t>Иванов ФИО Петр</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>Подпись</w:t></w:r></w:p>
        <w:p><w:pPr><w:pStyle w:val="${STYLE_TABULAR1}"/></w:pPr><w:r><w:tab/></w:r><w:r><w:t>Текст без упоминания</w:t></w:r></w:p>
      </w:body>
    `;

    const { xml: resultXml, changes } = applySignatureFormatting(inputXml, {});
    expect(normalizeXmlForComparison(resultXml)).toBe(normalizeXmlForComparison(expectedXml));
    expect(changes).toBe(1);
  });

  it('должен пропускать параграфы без стиля Tabular1, даже если есть "ФИО"', () => {
    const inputXml = `
      <w:body>
        <w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:tab/></w:r><w:r><w:t>Иванов ФИО Петр</w:t></w:r></w:p>
      </w:body>
    `;

    const expectedXml = inputXml; // Должен остаться без изменений

    const { xml: resultXml, changes } = applySignatureFormatting(inputXml, {});
    expect(normalizeXmlForComparison(resultXml)).toBe(normalizeXmlForComparison(expectedXml));
    expect(changes).toBe(0);
  });

  it('должен пропускать параграфы стиля Tabular1, если нет "ФИО"', () => {
    const inputXml = `
      <w:body>
        <w:p><w:pPr><w:pStyle w:val="${STYLE_TABULAR1}"/></w:pPr><w:r><w:tab/></w:r><w:r><w:t>Просто текст</w:t></w:r></w:p>
      </w:body>
    `;

    const expectedXml = inputXml; // Должен остаться без изменений

    const { xml: resultXml, changes } = applySignatureFormatting(inputXml, {});
    expect(normalizeXmlForComparison(resultXml)).toBe(normalizeXmlForComparison(expectedXml));
    expect(changes).toBe(0);
  });

  it('должен обрабатывать несколько вхождений в одном документе', () => {
    const inputXml = `
      <w:body>
        <w:p><w:pPr><w:pStyle w:val="${STYLE_TABULAR1}"/></w:pPr><w:r><w:tab/></w:r><w:r><w:t>ФИО первого</w:t></w:r></w:p>
        <w:p><w:pPr><w:pStyle w:val="${STYLE_TABULAR1}"/></w:pPr><w:r><w:tab/></w:r><w:r><w:t>ФИО второго</w:t></w:r></w:p>
        <w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:tab/></w:r><w:r><w:t>ФИО третьего (игнор)</w:t></w:r></w:p>
      </w:body>
    `;

    const expectedXml = `
      <w:body>
        <w:p><w:pPr><w:pStyle w:val="${STYLE_TABULAR2}"/></w:pPr><w:r><w:t>ФИО первого</w:t></w:r></w:p>
        <w:p><w:pPr><w:pStyle w:val="${STYLE_TABULAR2}"/></w:pPr><w:r><w:t>ФИО второго</w:t></w:r></w:p>
        <w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:tab/></w:r><w:r><w:t>ФИО третьего (игнор)</w:t></w:r></w:p>
      </w:body>
    `;

    const { xml: resultXml, changes } = applySignatureFormatting(inputXml, {});
    expect(normalizeXmlForComparison(resultXml)).toBe(normalizeXmlForComparison(expectedXml));
    expect(changes).toBe(2);
  });

  it('должен обрабатывать пустой ввод', () => {
    const { xml: resultXml, changes } = applySignatureFormatting('', {});
    expect(resultXml).toBe('');
    expect(changes).toBe(0);
  });
});