import { convertTwoColumnTablesToTabbedParagraphs } from './convertTwoColumnTablesToTabbedParagraphs';

describe('convertTwoColumnTablesToTabbedParagraphs', () => {
  // Поскольку processor.ts добавляет xmlns:w на корневой <w:document>
  // и мы тестируем фрагменты, нам не нужно указывать xmlns:w здесь.
  // Также не нужно указывать <?xml ...?> в expectedXml.
  // Сравнение будет максимально простым, как в cleanupParaProps.

  it('должен корректно конвертировать простую двухколоночную таблицу', () => {
    const inputXml = `
      <w:body>
        <w:tbl>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Cell 1A</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>Cell 1B</w:t></w:r></w:p></w:tc>
          </w:tr>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Cell 2A</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>Cell 2B</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
      </w:body>
    `;

    const expectedXml = `
      <w:body>
        <w:p><w:pPr><w:pStyle w:val="Tabular1"/></w:pPr><w:r><w:tab/></w:r><w:r><w:t>Cell 1A</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>Cell 1B</w:t></w:r></w:p>
        <w:p><w:pPr><w:pStyle w:val="Tabular1"/></w:pPr><w:r><w:tab/></w:r><w:r><w:t>Cell 2A</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>Cell 2B</w:t></w:r></w:p>
      </w:body>
    `;

    const { xml: resultXml, changes } = convertTwoColumnTablesToTabbedParagraphs(inputXml, {});
    
    // Сравниваем, удаляя все пробельные символы, как в cleanupParaProps
    expect(resultXml.replace(/\s/g, '')).toBe(expectedXml.replace(/\s/g, ''));
    expect(changes).toBe(1);
  });

  it('должен обрабатывать таблицы с форматированным текстом и множеством абзацев в ячейках', () => {
    const inputXml = `
      <w:body>
        <w:tbl>
          <w:tr>
            <w:tc>
              <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Bold Text</w:t></w:r></w:p>
              <w:p><w:r><w:t>Paragraph 2</w:t></w:r></w:p>
            </w:tc>
            <w:tc>
              <w:p><w:r><w:rPr><w:i/></w:rPr><w:t>Italic</w:t></w:r></w:p>
            </w:tc>
          </w:tr>
        </w:tbl>
      </w:body>
    `;

    const expectedXml = `
      <w:body>
        <w:p>
          <w:pPr><w:pStyle w:val="Tabular1"/></w:pPr>
          <w:r><w:tab/></w:r>
          <w:r><w:rPr><w:b/></w:rPr><w:t>Bold Text</w:t></w:r>
          <w:r><w:br/></w:r>
          <w:r><w:t>Paragraph 2</w:t></w:r>
          <w:r><w:tab/></w:r>
          <w:r><w:rPr><w:i/></w:rPr><w:t>Italic</w:t></w:r>
        </w:p>
      </w:body>
    `;

    const { xml: resultXml, changes } = convertTwoColumnTablesToTabbedParagraphs(inputXml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(expectedXml.replace(/\s/g, ''));
    expect(changes).toBe(1);
  });

  it('должен игнорировать таблицы с количеством колонок отличным от двух', () => {
    const inputXml = `
      <w:body>
        <w:tbl>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Col 1</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>Col 2</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>Col 3</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
        <w:tbl>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Col 1</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
        <w:p><w:r><w:t>Normal text.</w:t></w:r></w:p>
      </w:body>
    `;

    const { xml: resultXml, changes } = convertTwoColumnTablesToTabbedParagraphs(inputXml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(inputXml.replace(/\s/g, ''));
    expect(changes).toBe(0);
  });

  it('должен корректно обрабатывать пустые ячейки', () => {
    const inputXml = `
      <w:body>
        <w:tbl>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Content</w:t></w:r></w:p></w:tc>
            <w:tc><w:p/></w:tc>
          </w:tr>
          <w:tr>
            <w:tc><w:p/></w:tc>
            <w:tc><w:p><w:r><w:t>Content 2</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
      </w:body>
    `;

    const expectedXml = `
      <w:body>
        <w:p><w:pPr><w:pStyle w:val="Tabular1"/></w:pPr><w:r><w:tab/></w:r><w:r><w:t>Content</w:t></w:r><w:r><w:tab/></w:r></w:p>
        <w:p><w:pPr><w:pStyle w:val="Tabular1"/></w:pPr><w:r><w:tab/></w:r><w:r><w:tab/></w:r><w:r><w:t>Content 2</w:t></w:r></w:p>
      </w:body>
    `;

    const { xml: resultXml, changes } = convertTwoColumnTablesToTabbedParagraphs(inputXml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(expectedXml.replace(/\s/g, ''));
    expect(changes).toBe(1);
  });

  it('должен возвращать исходный XML, если нет таблиц', () => {
    const inputXml = `
      <w:body>
        <w:p><w:r><w:t>Just some text.</w:t></w:r></w:p>
      </w:body>
    `;
    const { xml: resultXml, changes } = convertTwoColumnTablesToTabbedParagraphs(inputXml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(inputXml.replace(/\s/g, ''));
    expect(changes).toBe(0);
  });

  it('должен обрабатывать несколько двухколоночных таблиц', () => {
    const inputXml = `
      <w:body>
        <w:tbl>
          <w:tr><w:tc><w:p><w:r><w:t>T1C1A</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>T1C1B</w:t></w:r></w:p></w:tc></w:tr>
        </w:tbl>
        <w:p><w:r><w:t>Separator</w:t></w:r></w:p>
        <w:tbl>
          <w:tr><w:tc><w:p><w:r><w:t>T2C1A</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>T2C1B</w:t></w:r></w:p></w:tc></w:tr>
        </w:tbl>
      </w:body>
    `;

    const expectedXml = `
      <w:body>
        <w:p><w:pPr><w:pStyle w:val="Tabular1"/></w:pPr><w:r><w:tab/></w:r><w:r><w:t>T1C1A</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>T1C1B</w:t></w:r></w:p>
        <w:p><w:r><w:t>Separator</w:t></w:r></w:p>
        <w:p><w:pPr><w:pStyle w:val="Tabular1"/></w:pPr><w:r><w:tab/></w:r><w:r><w:t>T2C1A</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>T2C1B</w:t></w:r></w:p>
      </w:body>
    `;

    const { xml: resultXml, changes } = convertTwoColumnTablesToTabbedParagraphs(inputXml, {});
    expect(resultXml.replace(/\s/g, '')).toBe(expectedXml.replace(/\s/g, ''));
    expect(changes).toBe(2);
  });
});