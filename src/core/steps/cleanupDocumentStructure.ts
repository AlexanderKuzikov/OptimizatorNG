/**
 * Выполняет одиночный проход для очистки XML-кода от "мусорных" тегов и атрибутов.
 * Эта версия НЕ выполняет слияние тегов <w:r>.
 */
interface StepResult {
  xml: string;
  changes: number;
}

export function cleanupDocumentStructure(xmlString: string, params: any): StepResult {
  let totalChanges = 0;
  let currentXml = xmlString;

  const cleanupRules = [
    // Правила, которые были изначально:
    { regex: /<!--[\s\S]*?-->/g, replacement: '' }, // Удаляет XML-комментарии
    { regex: /<w:lang[^>]*\/>/g, replacement: '' }, // Удаляет теги <w:lang/>
    { regex: /\s+w:rsid\w*="[^"]*"/g, replacement: '' }, // Удаляет атрибуты rsid
    { regex: /<\/?w:proofErr[^>]*>/g, replacement: '' }, // Удаляет теги <w:proofErr>
    { regex: /<\/?w:bookmark(Start|End)[^>]*>/g, replacement: '' }, // Удаляет теги закладок
    { regex: /<w:jc[^>]*\/>/g, replacement: '' }, // Удаляет теги <w:jc/>
    { regex: /<w:rPr><\/w:rPr>/g, replacement: '' }, // Удаляет пустые <w:rPr></w:rPr>
    { regex: /<w:r\/>/g, replacement: '' }, // Удаляет пустые самозакрывающиеся <w:r/>
    { regex: /<w:r><w:rPr\/><w:t><\/w:t><\/w:r>/g, replacement: '' }, // Удаляет <w:r> с пустыми <w:rPr/> и <w:t></w:t>

    // НОВЫЕ СТРОГИЕ РЕГУЛЯРКИ: Удаляют <w:p>, содержащие только <w:pPr> и ТОЧНО ОДИН из "невидимых" элементов.
    // Каждый вариант w:pPr обрабатывается ОТДЕЛЬНО, чтобы избежать жадности.

    // 1. Для ТОЧНО <w:p><w:pPr/></w:p> без пробельных символов между <w:pPr/> и </w:p>
    { regex: /<w:p><w:pPr\/><\/w:p>/g, replacement: '<w:p/>' },

    // 2. Для <w:p> с САМОЗАКРЫВАЮЩИМСЯ <w:pPr/> и ТОЛЬКО одним <w:r> с пробелом
    { regex: /<w:p><w:pPr\/>\s*(<w:r><w:t[^>]*?>\s+<\/w:t><\/w:r>)\s*<\/w:p>/g, replacement: '<w:p/>' },
    // 3. Для <w:p> с ОБЫЧНЫМ <w:pPr>...</w:pPr> и ТОЛЬКО одним <w:r> с пробелом. Вынесен в отдельную функцию.
//  { regex: /<w:p><w:pPr[^>]*>[\s\S]*?<\/w:pPr>\s*(<w:r><w:t[^>]*?>\s+<\/w:t><\/w:r>)\s*<\/w:p>/g, replacement: '<w:p/>' },

    // 4. Для <w:p> с САМОЗАКРЫВАЮЩИМСЯ <w:pPr/> и ТОЛЬКО одним <w:r> с табуляцией
    { regex: /<w:p><w:pPr\/>\s*(<w:r><w:tab\/><\/w:r>)\s*<\/w:p>/g, replacement: '<w:p/>' },
    // 5. Для <w:p> с ОБЫЧНЫМ <w:pPr>...</w:pPr> и ТОЛЬКО одним <w:r> с табуляцией
    { regex: /<w:p><w:pPr[^>]*>[\s\S]*?<\/w:pPr>\s*(<w:r><w:tab\/><\/w:r>)\s*<\/w:p>/g, replacement: '<w:p/>' },

    // 6. Для <w:p> с САМОЗАКРЫВАЮЩИМСЯ <w:pPr/> и ТОЛЬКО одним <w:r> с разрывом строки
    { regex: /<w:p><w:pPr\/>\s*(<w:r><w:br\/><\/w:r>)\s*<\/w:p>/g, replacement: '<w:p/>' },
    // 7. Для <w:p> с ОБЫЧНЫМ <w:pPr>...</w:pPr> и ТОЛЬКО одним <w:r> с разрывом строки
    { regex: /<w:p><w:pPr[^>]*>[\s\S]*?<\/w:pPr>\s*(<w:r><w:br\/><\/w:r>)\s*<\/w:p>/g, replacement: '<w:p/>' },

    // 8. Для <w:p> с САМОЗАКРЫВАЮЩИМСЯ <w:pPr/> и ТОЛЬКО самозакрывающимся <w:r/>
    { regex: /<w:p><w:pPr\/>\s*(<w:r\/>)\s*<\/w:p>/g, replacement: '<w:p/>' },
    // 9. Для <w:p> с ОБЫЧНЫМ <w:pPr>...</w:pPr> и ТОЛЬКО самозакрывающимся <w:r/>
    { regex: /<w:p><w:pPr[^>]*>[\s\S]*?<\/w:pPr>\s*(<w:r\/>)\s*<\/w:p>/g, replacement: '<w:p/>' },
    
    // 10. Для <w:p> с САМОЗАКРЫВАЮЩИМСЯ <w:pPr/> и ТОЛЬКО w:r с пустыми w:rPr и w:t
    { regex: /<w:p><w:pPr\/>\s*(<w:r><w:rPr\/><w:t><\/w:t><\/w:r>)\s*<\/w:p>/g, replacement: '<w:p/>' },
    // 11. Для <w:p> с ОБЫЧНЫМ <w:pPr>...</w:pPr> и ТОЛЬКО w:r с пустыми w:rPr и w:t
    { regex: /<w:p><w:pPr[^>]*>[\s\S]*?<\/w:pPr>\s*(<w:r><w:rPr\/><w:t><\/w:t><\/w:r>)\s*<\/w:p>/g, replacement: '<w:p/>' },
  ];

  for (const rule of cleanupRules) {
      const matches = currentXml.match(rule.regex);
      if (matches) {
          totalChanges += matches.length;
          currentXml = currentXml.replace(rule.regex, rule.replacement);
      }
  }

  return { xml: currentXml, changes: totalChanges };
}