"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTrailingSpaces = removeTrailingSpaces;
function removeTrailingSpaces(xmlString, params) {
    const trailingSpaceRegex = /\s+<\/w:t>/g;
    const matches = xmlString.match(trailingSpaceRegex);
    const changes = matches ? matches.length : 0;
    const xml = xmlString.replace(trailingSpaceRegex, '</w:t>');
    return { xml, changes };
}
