interface StepResult { xml: string; changes: number; }

export function removeFontSize(xmlString: string, params: any): StepResult {
  let totalChanges = 0;

  // Шаг 1: Удаление размера шрифта
  const szRegex = /<w:sz[^>]*\/>/g;
  const szMatches = xmlString.match(szRegex);
  totalChanges += szMatches ? szMatches.length : 0;
  let xml = xmlString.replace(szRegex, '');

  // Шаг 2: Удаление курсива
  const italicRegex = /<w:i\/>/g;
  const italicMatches = xml.match(italicRegex);
  totalChanges += italicMatches ? italicMatches.length : 0;
  xml = xml.replace(italicRegex, '');
  
  // Шаг 3: Удаление подчеркивания (всех типов)
  const underlineRegex = /<w:u .*?\/>/g;
  const underlineMatches = xml.match(underlineRegex);
  totalChanges += underlineMatches ? underlineMatches.length : 0;
  xml = xml.replace(underlineRegex, '');

  return { xml, changes: totalChanges };
}