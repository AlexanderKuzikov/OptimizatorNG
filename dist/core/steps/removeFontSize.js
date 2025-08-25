"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFontSize = removeFontSize;
function removeFontSize(xmlString, params) {
    const fontSizeRegex = /<w:sz[^>]*\/>/g;
    const matches = xmlString.match(fontSizeRegex);
    const changes = matches ? matches.length : 0;
    const xml = xmlString.replace(fontSizeRegex, '');
    return { xml, changes };
}
