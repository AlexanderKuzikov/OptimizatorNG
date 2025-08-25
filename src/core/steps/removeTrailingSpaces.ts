interface StepResult { xml: string; changes: number; }

export function removeTrailingSpaces(xmlString: string, params: any): StepResult {
  const trailingSpaceRegex = /\s+<\/w:t>/g;
  const matches = xmlString.match(trailingSpaceRegex);
  const changes = matches ? matches.length : 0;
  const xml = xmlString.replace(trailingSpaceRegex, '</w:t>');
  return { xml, changes };
}