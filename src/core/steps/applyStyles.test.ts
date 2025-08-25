import * as fs from 'fs';
import { applyStyles } from './applyStyles';

jest.mock('fs');

describe('applyStyles', () => {
  const mockTemplateContent = '<w:styles>Mock styles</w:styles>';

  beforeEach(() => {
    (fs.readFileSync as jest.Mock).mockReturnValue(mockTemplateContent);
  });

  test('should return template content and 1 change if content is different', () => {
    const result = applyStyles('<w:styles>Old styles</w:styles>', { templateFileName: 'mock.xml' });
    expect(result.xml).toBe(mockTemplateContent);
    expect(result.changes).toBe(1);
  });

  test('should return original content and 0 changes if content is the same', () => {
    const result = applyStyles(mockTemplateContent, { templateFileName: 'mock.xml' });
    expect(result.xml).toBe(mockTemplateContent);
    expect(result.changes).toBe(0);
  });
});