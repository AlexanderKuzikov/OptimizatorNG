import * as fs from 'fs';
import * as path from 'path';

interface StepResult { xml: string; changes: number; }

export function applyStyles(xmlString: string, params: { templateFileName: string }): StepResult {
  const templatePath = path.join(__dirname, '..', '..', 'templates', params.templateFileName);
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  
  if (xmlString === templateContent) {
    return { xml: xmlString, changes: 0 };
  }
  
  return { xml: templateContent, changes: 1 };
}