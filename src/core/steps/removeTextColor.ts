interface StepResult { xml: string; changes: number; }

export function removeTextColor(xmlString: string, params: { preservedColors: string[] }): StepResult {
  const { preservedColors } = params;
  let changes = 0;
  
  const regex = /<w:color[^>]*\/>/g;

  const xml = xmlString.replace(regex, (match) => {
    const shouldPreserve = preservedColors.some(color => 
      new RegExp(`w:val="${color}"`, 'i').test(match)
    );
    
    if (shouldPreserve) {
      return match;
    } else {
      changes++;
      return '';
    }
  });

  return { xml, changes };
}