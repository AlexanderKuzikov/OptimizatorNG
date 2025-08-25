"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTextColor = removeTextColor;
function removeTextColor(xmlString, params) {
    const { preservedColors } = params;
    let changes = 0;
    const regex = /<w:color[^>]*\/>/g;
    const xml = xmlString.replace(regex, (match) => {
        const shouldPreserve = preservedColors.some(color => new RegExp(`w:val="${color}"`, 'i').test(match));
        if (shouldPreserve) {
            return match;
        }
        else {
            changes++;
            return '';
        }
    });
    return { xml, changes };
}
