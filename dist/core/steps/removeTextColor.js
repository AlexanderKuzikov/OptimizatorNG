"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTextColor = removeTextColor;
function removeTextColor(xmlString, params) {
    const { preservedColors } = params;
    let changes = 0;
    let xml = xmlString;
    // --- ШАГ 1: Удаляем ЦВЕТ ТЕКСТА (<w:color>), сохраняя зарезервированные ---
    const colorRegex = /<w:color w:val="([^"]*)"[^>]*\/>/g;
    xml = xml.replace(colorRegex, (match, colorValue) => {
        // Проверяем, есть ли текущий цвет в списке зарезервированных (без учета регистра)
        const shouldPreserve = preservedColors.some(pColor => pColor.toUpperCase() === colorValue.toUpperCase());
        if (shouldPreserve) {
            return match; // Если цвет нужно сохранить, возвращаем его как есть
        }
        changes++;
        return ''; // Иначе, удаляем тег
    });
    // --- ШАГ 2: Удаляем ЦВЕТ ФОНА (<w:shd>), сохраняя зарезервированные ---
    const shadeRegex = /<w:shd w:val="clear" w:color="auto" w:fill="([^"]*)"\/>/g;
    xml = xml.replace(shadeRegex, (match, fillColor) => {
        // Та же логика проверки для цвета фона
        const shouldPreserve = preservedColors.some(pColor => pColor.toUpperCase() === fillColor.toUpperCase());
        if (shouldPreserve) {
            return match; // Сохраняем, если нужно
        }
        changes++;
        return ''; // Удаляем
    });
    return { xml, changes };
}
