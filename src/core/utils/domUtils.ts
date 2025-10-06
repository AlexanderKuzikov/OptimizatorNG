import { DOMParser } from 'xmldom';

const _parser = new DOMParser();
type XmldomNode = NonNullable<ReturnType<typeof _parser.parseFromString>['firstChild']>;
type XmldomElement = NonNullable<ReturnType<typeof _parser.parseFromString>['documentElement']>;

/**
 * Генерирует надежный, канонический "отпечаток" форматирования для w:rPr элемента.
 * @param rPrNode Узел <w:rPr>
 * @returns Строка, представляющая нормализованное форматирование, или 'NO_FORMATTING'.
 */
export function getFormattingSignature(rPrNode: XmldomNode | null): string {
    if (!rPrNode) {
        return 'NO_FORMATTING';
    }

    const properties: string[] = [];

    for (let i = 0; i < rPrNode.childNodes.length; i++) {
        const child = rPrNode.childNodes[i];
        if (child.nodeType === 1) { // Node.ELEMENT_NODE
            const elementChild = child as XmldomElement;
            const tagName = elementChild.localName || elementChild.nodeName;
            
            const attrs: string[] = [];
            if (elementChild.attributes) {
                // Собираем все атрибуты в массив строк "ключ=значение"
                for (let j = 0; j < elementChild.attributes.length; j++) {
                    const attr = elementChild.attributes[j];
                    attrs.push(`${attr.localName || attr.nodeName}=${attr.value}`);
                }
            }
            // Сортируем атрибуты в алфавитном порядке
            attrs.sort();
            // Собираем строку вида "тег(атрибут1,атрибут2)"
            properties.push(`${tagName}(${attrs.join(',')})`);
        }
    }

    // Сортируем все свойства в алфавитном порядке
    properties.sort();
    
    // Объединяем в единую строку-ключ
    return properties.join(';');
}