interface StepResult { xml: string; changes: number; }

export function removeIndentation(xmlString: string, params: any): StepResult {
  const indentationRegex = /<w:ind[^>]*\/>/g;
  const matches = xmlString.match(indentationRegex);
  const changes = matches ? matches.length : 0;
  const xml = xmlString.replace(indentationRegex, '');
  return { xml, changes };
}