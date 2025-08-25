import { applyStyles } from './applyStyles';

describe('applyStyles', () => {
  const mockTemplateContent = '<w:styles>Mock styles</w:styles>';

  test('should return template content and 1 change if content is different', () => {
    // Теперь передаем templateContent напрямую
    const result = applyStyles('<w:styles>Old styles</w:styles>', { templateContent: mockTemplateContent });
    expect(result.xml).toBe(mockTemplateContent);
    expect(result.changes).toBe(1);
  });

  test('should return original content and 0 changes if content is the same', () => {
    // Теперь передаем templateContent напрямую
    const result = applyStyles(mockTemplateContent, { templateContent: mockTemplateContent });
    expect(result.xml).toBe(mockTemplateContent);
    expect(result.changes).toBe(0);
  });
});