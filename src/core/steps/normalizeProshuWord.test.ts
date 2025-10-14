import { normalizeProshuWord } from './normalizeProshuWord';

describe('normalizeProshuWord', () => {
  it('должен заменить "ПРОШУ" на "Прошу" в простом тексте', () => {
    const inputXml = `<w:t>Я ПРОШУ Вас рассмотреть.</w:t>`;
    const expectedXml = `<w:t>Я Прошу Вас рассмотреть.</w:t>`;
    const { xml: resultXml, changes } = normalizeProshuWord(inputXml, {});
    expect(resultXml).toBe(expectedXml);
    expect(changes).toBe(1);
  });

  it('должен заменить все вхождения "ПРОШУ"', () => {
    const inputXml = `<w:t>ПРОШУ рассмотреть ПРОШУ Вас.</w:t>`;
    const expectedXml = `<w:t>Прошу рассмотреть Прошу Вас.</w:t>`;
    const { xml: resultXml, changes } = normalizeProshuWord(inputXml, {});
    expect(resultXml).toBe(expectedXml);
    expect(changes).toBe(2);
  });

  it('должен игнорировать другие формы слова', () => {
    const inputXml = `<w:t>Прошу рассмотреть, прошу Вас.</w:t>`;
    const expectedXml = inputXml; // Должен остаться без изменений
    const { xml: resultXml, changes } = normalizeProshuWord(inputXml, {});
    expect(resultXml).toBe(expectedXml);
    expect(changes).toBe(0);
  });

  it('должен работать с текстом, где "ПРОШУ" является частью другого слова (по текущей логике)', () => {
    const inputXml = `<w:t>ПрошуПРОШУРассмотреть</w:t>`;
    const expectedXml = `<w:t>ПрошуПрошуРассмотреть</w:t>`;
    const { xml: resultXml, changes } = normalizeProshuWord(inputXml, {});
    expect(resultXml).toBe(expectedXml);
    expect(changes).toBe(1);
  });

  it('должен обрабатывать пустой ввод', () => {
    const { xml, changes } = normalizeProshuWord('', {});
    expect(xml).toBe('');
    expect(changes).toBe(0);
  });

  it('должен работать, если "ПРОШУ" находится в разных w:t блоках', () => {
    const inputXml = `<w:p><w:r><w:t>Я</w:t></w:r><w:r><w:t>ПРОШУ</w:t></w:r><w:r><w:t>Вас</w:t></w:r></w:p>`;
    const expectedXml = `<w:p><w:r><w:t>Я</w:t></w:r><w:r><w:t>Прошу</w:t></w:r><w:r><w:t>Вас</w:t></w:r></w:p>`;
    const { xml: resultXml, changes } = normalizeProshuWord(inputXml, {});
    expect(resultXml).toBe(expectedXml);
    expect(changes).toBe(1);
  });
});