"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeStyles = removeStyles;
function removeStyles(xmlString, params) {
    const styleRegex = /<w:pStyle[^>]*\/>/g;
    const matches = xmlString.match(styleRegex);
    const changes = matches ? matches.length : 0;
    const xml = xmlString.replace(styleRegex, '');
    return { xml, changes };
}
