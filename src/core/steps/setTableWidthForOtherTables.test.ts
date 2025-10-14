import { setTableWidthForOtherTables } from './setTableWidthForOtherTables';

describe('setTableWidthForOtherTables', () => {
  const WORD_NAMESPACE = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const PRINTABLE_WIDTH = 8505; // Примерное значение печатной ширины

  const normalizeXmlForComparison = (xmlString: string) => {
    return xmlString.replace(/\s/g, '');
  };

  it('должен устанавливать ширину и удалять отступы для корневой таблицы', () => {
    const inputXml = `
      <w:body>
        <w:tbl>
          <w:tblPr>
            <w:tblInd w:w="-100" w:type="dxa"/>
            <w:tblBorders/>
          </w:tblPr>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Col 1</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
      </w:body>
    `;

    const expectedXml = `
      <w:body>
        <w:tbl>
          <w:tblPr>
            <w:tblBorders/>
            <w:tblW w:type="dxa" w:w="${PRINTABLE_WIDTH}"/>
          </w:tblPr>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Col 1</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
      </w:body>
    `;

    const { xml: resultXml, changes } = setTableWidthForOtherTables(inputXml, { printableWidth: PRINTABLE_WIDTH });
    expect(normalizeXmlForComparison(resultXml)).toBe(normalizeXmlForComparison(expectedXml));
    expect(changes).toBe(1);
  });

  it('должен устанавливать ширину и не добавлять w:tblInd, если его нет', () => {
    const inputXml = `
      <w:body>
        <w:tbl>
          <w:tblPr>
            <w:tblBorders/>
          </w:tblPr>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Col 1</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
      </w:body>
    `;

    const expectedXml = `
      <w:body>
        <w:tbl>
          <w:tblPr>
            <w:tblBorders/>
            <w:tblW w:type="dxa" w:w="${PRINTABLE_WIDTH}"/>
          </w:tblPr>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Col 1</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
      </w:body>
    `;

    const { xml: resultXml, changes } = setTableWidthForOtherTables(inputXml, { printableWidth: PRINTABLE_WIDTH });
    expect(normalizeXmlForComparison(resultXml)).toBe(normalizeXmlForComparison(expectedXml));
    expect(changes).toBe(1);
  });

  it('должен пропускать вложенные таблицы и добавлять предупреждение', () => {
    const inputXml = `
      <w:body>
        <w:tbl>
          <w:tblPr>
            <w:tblInd w:w="100" w:type="dxa"/>
          </w:tblPr>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Outer Cell</w:t></w:r></w:p></w:tc>
            <w:tc>
              <w:tbl>
                <w:tr><w:tc><w:p><w:r><w:t>Nested Table</w:t></w:r></w:p></w:tc></w:tr>
              </w:tbl>
            </w:tc>
          </w:tr>
        </w:tbl>
      </w:body>
    `;

    const expectedXml = `
      <w:body>
        <w:tbl>
          <w:tblPr>
            <w:tblW w:type="dxa" w:w="${PRINTABLE_WIDTH}"/>
          </w:tblPr>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Outer Cell</w:t></w:r></w:p></w:tc>
            <w:tc>
                <w:p>
                    <w:r><w:rPr><w:color w:val="FFA500"/></w:rPr><w:t>ПРЕДУПРЕЖДЕНИЕ: Обнаружена вложенная таблица. Ширина и отступы не будут установлены.</w:t></w:r>
                </w:p>
              <w:tbl>
                <w:tr><w:tc><w:p><w:r><w:t>Nested Table</w:t></w:r></w:p></w:tc></w:tr>
              </w:tbl>
            </w:tc>
          </w:tr>
        </w:tbl>
      </w:body>
    `;

    const { xml: resultXml, changes } = setTableWidthForOtherTables(inputXml, { printableWidth: PRINTABLE_WIDTH });
    expect(normalizeXmlForComparison(resultXml)).toBe(normalizeXmlForComparison(expectedXml));
    expect(changes).toBe(1); // Изменяется только внешняя таблица
  });

  it('должен возвращать исходный XML, если printableWidth равен 0', () => {
    const inputXml = `
      <w:body>
        <w:tbl>
          <w:tblPr>
            <w:tblInd w:w="100" w:type="dxa"/>
          </w:tblPr>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Test</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
      </w:body>
    `;
    const { xml: resultXml, changes } = setTableWidthForOtherTables(inputXml, { printableWidth: 0 });
    expect(normalizeXmlForComparison(resultXml)).toBe(normalizeXmlForComparison(inputXml));
    expect(changes).toBe(0);
  });

  it('должен обрабатывать пустой ввод', () => {
    const { xml: resultXml, changes } = setTableWidthForOtherTables('', {});
    expect(resultXml).toBe('');
    expect(changes).toBe(0);
  });
});