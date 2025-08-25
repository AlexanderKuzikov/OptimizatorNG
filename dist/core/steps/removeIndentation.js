"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeIndentation = removeIndentation;
function removeIndentation(xmlString, params) {
    const indentationRegex = /<w:ind[^>]*\/>/g;
    const matches = xmlString.match(indentationRegex);
    const changes = matches ? matches.length : 0;
    const xml = xmlString.replace(indentationRegex, '');
    return { xml, changes };
}
