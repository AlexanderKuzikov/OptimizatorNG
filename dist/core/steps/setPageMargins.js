"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPageMargins = setPageMargins;
function setPageMargins(xmlString, params) {
    const { width, height, top, right, bottom, left, gutter } = params;
    const newSectPr = `<w:sectPr><w:pgSz w:w="${width}" w:h="${height}" w:orient="portrait" w:code="9"/><w:pgMar w:top="${top}" w:right="${right}" w:bottom="${bottom}" w:left="${left}" w:gutter="${gutter}"/></w:sectPr>`;
    // Сначала глобально удаляем ВСЕ существующие блоки <w:sectPr>, чтобы очистить место
    const cleanupRegex = /<w:sectPr>[\s\S]*?<\/w:sectPr>/g;
    const cleanedXml = xmlString.replace(cleanupRegex, '');
    // ИСПОЛЬЗУЕМ БОЛЕЕ НАДЕЖНЫЙ РЕГЕКС:
    // Он найдет </w:body> даже если перед ним есть пробелы, табуляция или переносы строк (\s*)
    const insertionRegex = /(\s*)<\/w:body>/;
    // Проверяем, нашли ли мы тег <body>
    if (!insertionRegex.test(cleanedXml)) {
        // Если тега <body> нет, это странный XML, возвращаем без изменений, чтобы не сломать.
        return { xml: xmlString, changes: 0 };
    }
    // Вставляем наш новый блок перед </w:body>, сохраняя пробельные символы, которые были до него.
    const finalXml = cleanedXml.replace(insertionRegex, `$1${newSectPr}</w:body>`);
    // Мы всегда вносим изменение (удаляем старое и/или добавляем новое), поэтому считаем это одной успешной операцией.
    return { xml: finalXml, changes: 1 };
}
