"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDuplicateSpaces = removeDuplicateSpaces;
function removeDuplicateSpaces(xmlString, params) {
    let changes = 0;
    const cleanedXml = xmlString.replace(/(<w:t.*?>)(.*?)(<\/w:t>)/g, (match, openTag, content, closeTag) => {
        const newContent = content.replace(/ {2,}/g, () => {
            changes++;
            return ' ';
        });
        return openTag + newContent + closeTag;
    });
    return { xml: cleanedXml, changes };
}
