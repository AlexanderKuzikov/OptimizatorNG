"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPageMargins = setPageMargins;
function setPageMargins(xmlString, params) {
    const { width, height, top, right, bottom, left, gutter } = params;
    const newSectPr = `<w:sectPr><w:pgSz w:w="${width}" w:h="${height}" w:orient="portrait" w:code="9"/><w:pgMar w:top="${top}" w:right="${right}" w:bottom="${bottom}" w:left="${left}" w:gutter="${gutter}"/></w:sectPr>`;
    const sectPrRegex = /<w:sectPr>[\s\S]*?<\/w:sectPr>/;
    if (sectPrRegex.test(xmlString)) {
        const oldSectPr = xmlString.match(sectPrRegex)[0];
        if (oldSectPr === newSectPr) {
            return { xml: xmlString, changes: 0 };
        }
        return { xml: xmlString.replace(sectPrRegex, newSectPr), changes: 1 };
    }
    else {
        return { xml: xmlString.replace(/<\/w:body>/, `${newSectPr}</w:body>`), changes: 1 };
    }
}
