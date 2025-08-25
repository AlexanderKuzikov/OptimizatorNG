interface StepResult { xml: string; changes: number; }

export function removeStyles(xmlString: string, params: any): StepResult {
  const styleRegex = /<w:pStyle[^>]*\/>/g;
  const matches = xmlString.match(styleRegex);
  const changes = matches ? matches.length : 0;
  const xml = xmlString.replace(styleRegex, '');
  return { xml, changes };
}