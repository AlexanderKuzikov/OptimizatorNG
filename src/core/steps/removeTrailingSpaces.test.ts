// Команда запуска: npm test removeTrailingSpaces

import { removeTrailingSpaces } from './removeTrailingSpaces';

describe('removeTrailingSpaces', () => {
  it('сокращает 2+ пробела в конце до одного', () => {
    const input = '<w:t>Текст   </w:t>';
    const expected = '<w:t>Текст </w:t>';
    const result = removeTrailingSpaces(input, {});
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(1);
  });

  it('НЕ трогает один пробел в конце', () => {
    const input = '<w:t>Текст </w:t>';
    const result = removeTrailingSpaces(input, {});
    expect(result.xml).toBe(input);
    expect(result.changes).toBe(0);
  });

  it('НЕ трогает тег, содержащий только пробелы', () => {
    const input = '<w:t>   </w:t>';
    const result = removeTrailingSpaces(input, {});
    expect(result.xml).toBe(input);
    expect(result.changes).toBe(0);
  });

  it('обрабатывает несколько тегов, сокращая где нужно', () => {
    const input = '<w:t>один  </w:t><w:t>два </w:t><w:t>три   </w:t>';
    const expected = '<w:t>один </w:t><w:t>два </w:t><w:t>три </w:t>';
    const result = removeTrailingSpaces(input, {});
    expect(result.xml).toBe(expected);
    expect(result.changes).toBe(2);
  });
});