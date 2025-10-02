// Команда запуска: npm test removeDuplicateSpaces

import { removeDuplicateSpaces } from './removeDuplicateSpaces';

describe('removeDuplicateSpaces', () => {
  it('заменяет двойные пробелы на одинарные', () => {
    const input = '<w:t>Текст  с пробелами</w:t>';
    const expected = '<w:t>Текст с пробелами</w:t>';
    const result = removeDuplicateSpaces(input, {});
    
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(1);
  });

  it('заменяет множественные пробелы на одинарные', () => {
    const input = '<w:t>Текст     с    пробелами</w:t>';
    const expected = '<w:t>Текст с пробелами</w:t>';
    const result = removeDuplicateSpaces(input, {});
    
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(2);
  });

  it('обрабатывает несколько тегов <w:t>', () => {
    const input = '<w:t>Первый  текст</w:t><w:t>Второй   текст</w:t>';
    const expected = '<w:t>Первый текст</w:t><w:t>Второй текст</w:t>';
    const result = removeDuplicateSpaces(input, {});
    
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(2);
  });

  it('удаляет атрибут xml:space="preserve" после чистки', () => {
    const input = '<w:t xml:space="preserve">Текст  с пробелами</w:t>';
    const expected = '<w:t>Текст с пробелами</w:t>';
    const result = removeDuplicateSpaces(input, {});
    
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(2); // 1 замена пробелов + 1 удаление атрибута
  });

  it('удаляет атрибут xml:space из нескольких тегов', () => {
    const input = '<w:t xml:space="preserve">Первый  текст</w:t><w:t xml:space="preserve">Второй</w:t>';
    const expected = '<w:t>Первый текст</w:t><w:t>Второй</w:t>';
    const result = removeDuplicateSpaces(input, {});
    
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(3); // 1 замена пробелов + 2 удаления атрибута
  });

  it('удаляет атрибут xml:space даже если нет множественных пробелов', () => {
    const input = '<w:t xml:space="preserve">Обычный текст</w:t>';
    const expected = '<w:t>Обычный текст</w:t>';
    const result = removeDuplicateSpaces(input, {});
    
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(1); // Только удаление атрибута
  });

  it('не изменяет текст без множественных пробелов и атрибута', () => {
    const input = '<w:t>Обычный текст</w:t>';
    const result = removeDuplicateSpaces(input, {});
    
    expect(result.xml).toBe(input);
    expect(result.changes).toBe(0);
  });

  it('сохраняет одинарные пробелы', () => {
    const input = '<w:t>Текст с одинарными пробелами</w:t>';
    const result = removeDuplicateSpaces(input, {});
    
    expect(result.xml).toBe(input);
    expect(result.changes).toBe(0);
  });

  it('не затрагивает пробелы вне тегов <w:t>', () => {
    const input = '<w:r>  <w:t>Текст</w:t>  </w:r>';
    const result = removeDuplicateSpaces(input, {});
    
    expect(result.xml).toBe(input);
    expect(result.changes).toBe(0);
  });

  it('обрабатывает теги с другими атрибутами', () => {
    const input = '<w:t xml:space="preserve" w:rsid="00123456">Текст  двойной</w:t>';
    const expected = '<w:t w:rsid="00123456">Текст двойной</w:t>';
    const result = removeDuplicateSpaces(input, {});
    
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(2);
  });

  it('возвращает 0 изменений для пустой строки', () => {
    const result = removeDuplicateSpaces('', {});
    
    expect(result.xml).toBe('');
    expect(result.changes).toBe(0);
  });

  it('обрабатывает реальный XML с форматированием', () => {
    const input = `
      <w:r>
        <w:rPr/>
        <w:t xml:space="preserve">Текст   с    пробелами</w:t>
      </w:r>
    `;
    const expected = `
      <w:r>
        <w:rPr/>
        <w:t>Текст с пробелами</w:t>
      </w:r>
    `;
    const result = removeDuplicateSpaces(input, {});
    
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(3); // 2 замены пробелов + 1 удаление атрибута
  });
});