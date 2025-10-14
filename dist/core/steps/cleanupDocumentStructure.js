"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupDocumentStructure = cleanupDocumentStructure;
function cleanupDocumentStructure(xmlString, params) {
    let totalChanges = 0;
    let currentXml = xmlString;
    // --- Единственный этап: Очистка "мусора" ---
    const finalCleanupRules = [
        // Правила, которые остаются:
        { regex: /<!--[\s\S]*?-->/g, replacement: '' },
        { regex: /<w:p><w:pPr>[\s\S]*?<\/w:pPr><\/w:p>/g, replacement: '<w:p/>' },
        { regex: /<w:lang[^>]*\/>/g, replacement: '' },
        { regex: /\s+w:rsid\w*="[^"]*"/g, replacement: '' },
        { regex: /<\/?w:proofErr[^>]*>/g, replacement: '' },
        { regex: /<\/?w:bookmark(Start|End)[^>]*>/g, replacement: '' },
        { regex: /<w:jc[^>]*\/>/g, replacement: '' },
        { regex: /<w:rPr><\/w:rPr>/g, replacement: '' },
        { regex: /<w:r\/>/g, replacement: '' },
        { regex: /<w:r><w:rPr\/><w:t><\/w:t><\/w:r>/g, replacement: '' }, // Шаг 10
    ];
    for (const rule of finalCleanupRules) {
        const matches = currentXml.match(rule.regex);
        if (matches) {
            totalChanges += matches.length;
            currentXml = currentXml.replace(rule.regex, rule.replacement);
        }
    }
    return { xml: currentXml, changes: totalChanges };
}
