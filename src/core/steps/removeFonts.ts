interface StepResult { xml: string; changes: number; }

export function removeFonts(xmlString: string, params: any): StepResult {
  const fontsRegex = /<w:rFonts[^>]*\/>/g;
  const matches = xmlString.match(fontsRegex);
  const changes = matches ? matches.length : 0;
  const xml = xmlString.replace(fontsRegex, '');
  return { xml, changes };
}