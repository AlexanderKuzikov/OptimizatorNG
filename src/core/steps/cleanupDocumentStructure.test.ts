// Команда запуска: npm test cleanupDocumentStructure

import { cleanupDocumentStructure } from './cleanupDocumentStructure';

describe('cleanupDocumentStructure', () => {

    // --- Тесты для Этапа 1: Основное слияние с канонизацией ---

    it('[Этап 1] должен объединять run-ы с одинаковыми, но неотсортированными свойствами', () => {
        const input = '<w:r><w:rPr><w:b/><w:i/></w:rPr><w:t>A</w:t></w:r><w:r><w:rPr><w:i/><w:b/></w:rPr><w:t>B</w:t></w:r>';
        const expected = '<w:r><w:rPr><w:b/><w:i/></w:rPr><w:t>AB</w:t></w:r>';
        const result = cleanupDocumentStructure(input, {});
        // Для предсказуемого теста приводим результат к одному виду
        const normalizedResult = result.xml.replace('<w:rPr><w:i/><w:b/></w:rPr>', '<w:rPr><w:b/><w:i/></w:rPr>');
        expect(normalizedResult).toBe(expected);
    });
    
    it('[Этап 1] НЕ должен объединять run с разными свойствами', () => {
        const input = '<w:r><w:rPr><w:b/></w:rPr><w:t>Bold</w:t></w:r><w:r><w:rPr><w:i/></w:rPr><w:t>Italic</w:t></w:r>';
        const result = cleanupDocumentStructure(input, {});
        expect(result.xml).toBe(input);
    });

    // --- Тесты для Этапа 2: Очистка ---

    it('[Этап 2] должен удалять теги <w:jc>, <w:proofErr>, <w:lang> и пустые <w:rPr>', () => {
        const input = '<w:p><w:pPr><w:jc w:val="both"/></w:pPr><w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:proofErr w:type="spellStart"/><w:t>text</w:t><w:proofErr w:type="spellEnd"/></w:r></w:p>';
        const expected = '<w:p><w:pPr></w:pPr><w:r><w:t>text</w:t></w:r></w:p>';
        const result = cleanupDocumentStructure(input, {});
        expect(result.xml).toBe(expected);
    });

    // --- Тесты для Этапа 3: Итеративное слияние простейшего случая ---

    it('[Этап 3] должен слить два соседних run БЕЗ СВОЙСТВ', () => {
        const input = '<w:r><w:t>Текст1</w:t></w:r><w:r><w:t>Текст2</w:t></w:r>';
        const expected = '<w:r><w:t>Текст1Текст2</w:t></w:r>';
        const result = cleanupDocumentStructure(input, {});
        expect(result.xml).toBe(expected);
    });

    it('[Этап 3] должен итеративно слить пять соседних run-ов без свойств', () => {
        const input = '<w:r><w:t>A</w:t></w:r><w:r><w:t>B</w:t></w:r><w:r><w:t>C</w:t></w:r><w:r><w:t>D</w:t></w:r><w:r><w:t>E</w:t></w:r>';
        const expected = '<w:r><w:t>ABCDE</w:t></w:r>';
        const result = cleanupDocumentStructure(input, {});
        expect(result.xml).toBe(expected);
    });

    it('[Этап 3] НЕ должен трогать run-ы, если один из них содержит <w:rPr>', () => {
        const input = '<w:r><w:t>Текст1</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>Текст2</w:t></w:r>';
        const result = cleanupDocumentStructure(input, {});
        // Этап 1 их не тронет. Этап 3 - тоже не должен.
        expect(result.xml).toBe(input); 
    });
    
    // --- Интеграционный тест ---
    
    it('[Интеграция] должен сначала слить сложное, а потом простое', () => {
        const input = `
            <w:p>
                <w:r><w:rPr><w:b/></w:rPr><w:t>Bold</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t> and </w:t></w:r>
                <w:r><w:t>simple</w:t></w:r><w:r><w:t> text.</w:t></w:r>
            </w:p>
        `;
        const expected = '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Bold and </w:t></w:r><w:r><w:t>simple text.</w:t></w:r></w:p>';
        const result = cleanupDocumentStructure(input, {});
        expect(result.xml.replace(/\s/g, '')).toBe(expected.replace(/\s/g, ''));
    });

});