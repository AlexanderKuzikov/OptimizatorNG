// Команда запуска: npm test cleanupDocumentStructure

import { cleanupDocumentStructure } from './cleanupDocumentStructure';

describe('cleanupDocumentStructure (Cleanup-Only Logic)', () => {

    it('должен удалять XML-комментарии', () => {
        const input = '<w:p><!-- Это комментарий --><w:r><w:t>Текст</w:t></w:r></w:p>';
        const expected = '<w:p><w:r><w:t>Текст</w:t></w:r></w:p>';
        const result = cleanupDocumentStructure(input, {});
        expect(result.xml).toBe(expected);
    });

    it('должен удалять служебные теги <w:proofErr> и <w:lang>', () => {
        const input = '<w:r><w:rPr><w:lang w:val="en-US"/></w:rPr><w:proofErr w:type="spellStart"/><w:t>text</w:t><w:proofErr w:type="spellEnd"/></w:r>';
        const expected = '<w:r><w:rPr></w:rPr><w:t>text</w:t></w:r>';
        const result = cleanupDocumentStructure(input, {});
        // Финальный результат будет без <w:rPr>, т.к. оно тоже удаляется следующим правилом
        const finalExpected = '<w:r><w:t>text</w:t></w:r>';
        expect(result.xml).toBe(finalExpected);
    });

    it('должен удалять пустые блоки <w:rPr></w:rPr>', () => {
        const input = '<w:r><w:rPr></w:rPr><w:t>Текст</w:t></w:r>';
        const expected = '<w:r><w:t>Текст</w:t></w:r>';
        const result = cleanupDocumentStructure(input, {});
        expect(result.xml).toBe(expected);
    });

    it('должен удалять пустые "сложные" run-ы (Шаг 10)', () => {
        const input = '<w:p><w:r><w:t>Начало</w:t></w:r><w:r><w:rPr/><w:t></w:t></w:r><w:r><w:t>Конец</w:t></w:r></w:p>';
        const expected = '<w:p><w:r><w:t>Начало</w:t></w:r><w:r><w:t>Конец</w:t></w:r></w:p>';
        const result = cleanupDocumentStructure(input, {});
        expect(result.xml).toBe(expected);
    });

    it('НЕ должен удалять пустые "простые" run-ы (Правило 15 удалено)', () => {
        const input = '<w:p><w:r><w:t></w:t></w:r></w:p>';
        const result = cleanupDocumentStructure(input, {});
        expect(result.xml).toBe(input);
    });
    
    it('НЕ должен выполнять слияние тегов <w:r>', () => {
        const input = '<w:r><w:t>Текст1</w:t></w:r><w:r><w:t>Текст2</w:t></w:r>';
        const result = cleanupDocumentStructure(input, {});
        expect(result.xml).toBe(input); // Ожидаем, что ничего не изменится
    });

});