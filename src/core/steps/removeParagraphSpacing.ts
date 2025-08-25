interface StepResult { xml: string; changes: number; }

export function removeParagraphSpacing(xmlString: string, params: any): StepResult {
  const spacingRegex = /<w:spacing[^>]*\/>/g;
  const matches = xmlString.match(spacingRegex);
  const changes = matches ? matches.length : 0;
  const xml = xmlString.replace(spacingRegex, '');
  return { xml, changes };
}