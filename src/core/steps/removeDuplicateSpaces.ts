interface StepResult { xml: string; changes: number; }

export function removeDuplicateSpaces(xmlString: string, params: any): StepResult {
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