/**
 * @param xmlString The XML string to process.
 * @param params An object containing parameters.
 * @param params.preservedStyleIds An optional array of style IDs to preserve.
 * @returns The processed XML string.
 */
export function removeStyles(
  xmlString: string,
  params: { preservedStyleIds?: string[] }
): string {
  // Быстрый путь: если список исключений пуст, удаляем все стили самым быстрым способом.
  if (!params.preservedStyleIds || params.preservedStyleIds.length === 0) {
    const regex = /<w:(p|r)Style[^>]*\/>/g;
    return xmlString.replace(regex, '');
  }

  // "Умный" путь: если есть стили для сохранения.
  const preservedIds = params.preservedStyleIds;
  const regex = /<w:(p|r)Style w:val="([^"]+)"\/>/g;

  return xmlString.replace(regex, (originalTag, pOrR, styleId) => {
    if (preservedIds.includes(styleId)) {
      return originalTag;
    }
    return '';
  });
}