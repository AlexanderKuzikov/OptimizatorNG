"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeParagraphSpacing = removeParagraphSpacing;
function removeParagraphSpacing(xmlString, params) {
    const spacingRegex = /<w:spacing[^>]*\/>/g;
    const matches = xmlString.match(spacingRegex);
    const changes = matches ? matches.length : 0;
    const xml = xmlString.replace(spacingRegex, '');
    return { xml, changes };
}
