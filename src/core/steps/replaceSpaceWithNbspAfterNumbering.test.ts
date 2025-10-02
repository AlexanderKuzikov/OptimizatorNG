import { replaceSpaceWithNbspAfterNumbering } from './replaceSpaceWithNbspAfterNumbering';

describe('replaceSpaceWithNbspAfterNumbering', () => {
  it('заменяет пробел после однозначной нумерации', () => {
    const input = '<w:t>1. Текст пункта</w:t>';
    const expected = '<w:t>1.\u00A0Текст пункта</w:t>';
    const result = replaceSpaceWithNbspAfterNumbering(input, {});
    
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(1);
  });

  it('заменяет пробел после многозначной нумерации', () => {
    const input = '<w:t>12. Текст пункта</w:t>';
    const expected = '<w:t>12.\u00A0Текст пункта</w:t>';
    const result = replaceSpaceWithNbspAfterNumbering(input, {});
    
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(1);
  });

  it('заменяет пробел после двухуровневой нумерации', () => {
    const input = '<w:t>1.2. Текст пункта</w:t>';
    const expected = '<w:t>1.2.\u00A0Текст пункта</w:t>';
    const result = replaceSpaceWithNbspAfterNumbering(input, {});
    
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(1);
  });

  it('заменяет пробел после трёхуровневой нумерации', () => {
    const input = '<w:t>1.2.3. Текст пункта</w:t>';
    const expected = '<w:t>1.2.3.\u00A0Текст пункта</w:t>';
    const result = replaceSpaceWithNbspAfterNumbering(input, {});
    
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(1);
  });

  it('заменяет пробел с многозначными числами на всех уровнях', () => {
    const input = '<w:t>10.20.30. Текст пункта</w:t>';
    const expected = '<w:t>10.20.30.\u00A0Текст пункта</w:t>';
    const result = replaceSpaceWithNbspAfterNumbering(input, {});
    
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(1);
  });

  it('НЕ заменяет пробел при четырёх уровнях (больше трёх)', () => {
    const input = '<w:t>1.2.3.4. Текст пункта</w:t>';
    const result = replaceSpaceWithNbspAfterNumbering(input, {});
    
    expect(result.xml).toBe(input); // Без изменений
    expect(result.changes).toBe(0);
  });

  it('НЕ заменяет пробел, если нумерация НЕ в начале абзаца', () => {
    const input = '<w:t>Смотри пункт 1.2. Там написано</w:t>';
    const result = replaceSpaceWithNbspAfterNumbering(input, {});
    
    expect(result.xml).toBe(input); // Без изменений
    expect(result.changes).toBe(0);
  });

  it('обрабатывает несколько нумерованных абзацев', () => {
    const input = '<w:p><w:t>1. Первый</w:t></w:p><w:p><w:t>2. Второй</w:t></w:p>';
    const expected = '<w:p><w:t>1.\u00A0Первый</w:t></w:p><w:p><w:t>2.\u00A0Второй</w:t></w:p>';
    const result = replaceSpaceWithNbspAfterNumbering(input, {});
    
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(2);
  });

  it('возвращает 0 изменений для пустой строки', () => {
    const result = replaceSpaceWithNbspAfterNumbering('', {});
    
    expect(result.xml).toBe('');
    expect(result.changes).toBe(0);
  });

  it('возвращает 0 изменений, если нумерация без пробела', () => {
    const input = '<w:t>1.Текст без пробела</w:t>';
    const result = replaceSpaceWithNbspAfterNumbering(input, {});
    
    expect(result.xml).toBe(input);
    expect(result.changes).toBe(0);
  });

  it('НЕ заменяет пробел в обычном тексте с числами', () => {
    const input = '<w:t>Цена 1.50 руб.</w:t>';
    const result = replaceSpaceWithNbspAfterNumbering(input, {});
    
    expect(result.xml).toBe(input);
    expect(result.changes).toBe(0);
  });
});