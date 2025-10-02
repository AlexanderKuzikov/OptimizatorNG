/**
 * Выполняет основную структурную оптимизацию XML.
 * Эта версия включает:
 * 1. Основной итеративный этап слияния со сложными свойствами.
 * 2. Финальный этап очистки от мусора.
 * 3. Отдельный итеративный прогон для слияния самых простых пар <w:r><w:t>,
 *    реализующий логику "найти первый, слить, начать заново".
 */
interface StepResult {
  xml: string;
  changes: number;
}

/**
 * Вспомогательная функция для получения канонического представления <w:rPr>.
 */
function getCanonicalRpr(rprString: string | null): string {
  if (!rprString) {
    return '';
  }
  const innerContent = rprString.replace(/<w:rPr>|<\/w:rPr>|<w:rPr\/>/g, '');
  if (!innerContent.trim()) {
    return '';
  }
  const tags = innerContent.match(/<[^>]+>/g);
  if (!tags) {
    return innerContent;
  }
  return tags.sort().join('');
}


export function cleanupDocumentStructure(xmlString: string, params: any): StepResult {
  let totalChanges = 0;
  let currentXml = xmlString;

  // --- ЭТАП 1: Основное слияние со сложными свойствами ---
  let hasMadeComplexMerges = false;
  do {
    hasMadeComplexMerges = false;
    const beforeMerge = currentXml;
    
    // НЕ-глобальный регекс для поиска и замены только ПЕРВОЙ пары.
    const adjacentRunsRegex = /(<w:r>[\s\S]+?<\/w:r>)(\s*)(<w:r>[\s\S]+?<\/w:r>)/;
    
    currentXml = currentXml.replace(adjacentRunsRegex, (match, run1, whitespace, run2) => {
      if (whitespace && whitespace.trim() !== '') {
        return match;
      }
      
      const rPrRegex = /<w:rPr>[\s\S]*?<\/w:rPr>|<w:rPr\/>/;
      
      const run1PropsRaw = run1.match(rPrRegex)?.[0] ?? null;
      const run2PropsRaw = run2.match(rPrRegex)?.[0] ?? null;

      const run1CanonicalProps = getCanonicalRpr(run1PropsRaw);
      const run2CanonicalProps = getCanonicalRpr(run2PropsRaw);

      if (run1CanonicalProps === run2CanonicalProps) {
        const tRegex = /<w:t([^>]*)>([\s\S]*?)<\/w:t>/;
        const run1TextMatch = run1.match(tRegex);
        const run2TextMatch = run2.match(tRegex);

        if (run1TextMatch && run2TextMatch) {
          const run1TagAttrs = run1TextMatch[1];
          const run2TagAttrs = run2TextMatch[1];
          // Сливаем, только если атрибуты тега <w:t> тоже совпадают
          if (run1TagAttrs === run2TagAttrs) {
            const combinedText = (run1TextMatch[2] || '') + (run2TextMatch[2] || '');
            return run1.replace(tRegex, `<w:t${run1TagAttrs}>${combinedText}</w:t>`);
          }
        }
      }
      
      return match;
    });

    if (beforeMerge !== currentXml) {
        hasMadeComplexMerges = true;
        totalChanges++;
    }
  } while (hasMadeComplexMerges);


  // --- ЭТАП 2: Полная пост-очистка ---
  const finalCleanupRules = [
      { regex: /<!--[\s\S]*?-->/g, replacement: '' },
      { regex: /<w:p><w:pPr>[\s\S]*?<\/w:pPr><\/w:p>/g, replacement: '<w:p/>' },
      { regex: /<w:lang[^>]*\/>/g, replacement: '' },
      { regex: /\s+w:rsid\w*="[^"]*"/g, replacement: '' },
      { regex: /<\/?w:proofErr[^>]*>/g, replacement: '' },
      { regex: /<\/?w:bookmark(Start|End)[^>]*>/g, replacement: '' },
      { regex: /<w:jc[^>]*\/>/g, replacement: '' },
      { regex: /<w:rPr><\/w:rPr>/g, replacement: '' },
      { regex: /<w:r\/>/g, replacement: '' },
      { regex: /<w:r><w:rPr\/><w:t><\/w:t><\/w:r>/g, replacement: '' },
      { regex: /<w:r><w:t><\/w:t><\/w:r>/g, replacement: '' },
  ];

  for (const rule of finalCleanupRules) {
      const matches = currentXml.match(rule.regex);
      if (matches) {
          totalChanges += matches.length;
          currentXml = currentXml.replace(rule.regex, rule.replacement);
      }
  }

  // --- ЭТАП 3: Итеративное слияние простейшего случая ---
  let hasMadeSimpleMerges = false;
  do {
    hasMadeSimpleMerges = false;
    const beforePass = currentXml;

    // НЕ-глобальный регекс, чтобы replace заменял только ПЕРВОЕ вхождение.
    const simpleMergeRegex = /<w:r><w:t>([\s\S]*?)<\/w:t><\/w:r><w:r><w:t>([\s\S]*?)<\/w:t><\/w:r>/;
    
    currentXml = currentXml.replace(simpleMergeRegex, (match, text1, text2) => {
        return `<w:r><w:t>${text1}${text2}</w:t></w:r>`;
    });

    if (beforePass !== currentXml) {
      // Замена произошла. Взводим флаг, чтобы цикл do..while повторился,
      // начав новый поиск с самого начала измененной строки.
      totalChanges++;
      hasMadeSimpleMerges = true;
    }

  } while (hasMadeSimpleMerges);


  return { xml: currentXml, changes: totalChanges };
}