"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFonts = removeFonts;
function removeFonts(xmlString, params) {
    const fontsRegex = /<w:rFonts[^>]*\/>/g;
    const matches = xmlString.match(fontsRegex);
    const changes = matches ? matches.length : 0;
    const xml = xmlString.replace(fontsRegex, '');
    return { xml, changes };
}
