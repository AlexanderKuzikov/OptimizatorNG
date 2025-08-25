interface StepResult { xml: string; changes: number; }

export function removeFontSize(xmlString: string, params: any): StepResult {
  const fontSizeRegex = /<w:sz[^>]*\/>/g;
  const matches = xmlString.match(fontSizeRegex);
  const changes = matches ? matches.length : 0;
  const xml = xmlString.replace(fontSizeRegex, '');
  return { xml, changes };
}