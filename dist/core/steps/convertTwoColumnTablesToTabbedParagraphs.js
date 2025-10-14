"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTwoColumnTablesToTabbedParagraphs = convertTwoColumnTablesToTabbedParagraphs;
var jsdom_1 = require("jsdom");
var TABLE_HEADER_STYLE_NAME = 'Tabular1';
var WORD_NAMESPACE = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
var DUMMY_TAG = 'dummy'; // Используем константу для dummyTag
/**
 * Извлекает все <w:r> элементы из всех <w:p> в ячейке, объединяя их.
 * Множественные абзацы внутри ячейки будут разделены <w:br/>.
 *
 * @param cellElement - DOM-элемент <w:tc>.
 * @param doc - Документ JSDOM для создания новых элементов.
 * @returns {runsXml: string, hasText: boolean} Объект с конкатенированным XML всех <w:r> и флагом наличия текста.
 */
function extractRunsAndTextFlagFromCell(cellElement, doc) {
    var allRunsContent = []; // Сохраняем DOM-элементы для последующей вставки
    var hasTextInCell = false;
    // Используем getElementsByTagNameNS для корректной работы с пространствами имен
    var paragraphs = Array.from(cellElement.getElementsByTagNameNS(WORD_NAMESPACE, 'p'));
    for (var _i = 0, paragraphs_1 = paragraphs; _i < paragraphs_1.length; _i++) {
        var p = paragraphs_1[_i];
        var runsContentFromParagraph = [];
        var hasTextInParagraph = false;
        var runs = Array.from(p.getElementsByTagNameNS(WORD_NAMESPACE, 'r'));
        for (var _a = 0, runs_1 = runs; _a < runs_1.length; _a++) {
            var r = runs_1[_a];
            // Клонируем run, чтобы не изменять исходный DOM ячейки до того, как будем готовы заменить всю таблицу
            runsContentFromParagraph.push(r.cloneNode(true));
            // Проверяем наличие <w:t> с содержимым, игнорируя только пробелы
            var texts = Array.from(r.getElementsByTagNameNS(WORD_NAMESPACE, 't'));
            if (texts.some(function (t) { return (t.textContent || '').trim() !== ''; })) {
                hasTextInParagraph = true;
            }
        }
        if (hasTextInParagraph) {
            if (hasTextInCell) {
                // Если в предыдущих абзацах уже был текст, добавляем разделитель (разрыв строки)
                var brRun = doc.createElementNS(WORD_NAMESPACE, 'w:r');
                brRun.appendChild(doc.createElementNS(WORD_NAMESPACE, 'w:br'));
                allRunsContent.push(brRun);
            }
            allRunsContent.push.apply(allRunsContent, runsContentFromParagraph);
            hasTextInCell = true;
        }
    }
    // Сериализуем собранные run-элементы в XML-строку, чтобы потом JSDOM мог их снова распарсить
    var tempDiv = doc.createElement('div'); // Временный контейнер для сериализации
    allRunsContent.forEach(function (run) { return tempDiv.appendChild(run); });
    var runsXml = tempDiv.innerHTML;
    return { runsXml: runsXml, hasText: hasTextInCell };
}
/**
 * Конвертирует двухколоночные таблицы в параграфы с табуляцией.
 * Каждая строка таблицы преобразуется в один параграф.
 * Содержимое первой ячейки, затем табуляция, затем содержимое второй ячейки.
 * Параграфы внутри ячеек объединяются с переносом строки.
 *
 * @param xml - Входящая XML-строка, может быть фрагментом word/document.xml.
 * @param params - Параметры (не используются в данной функции).
 * @returns Объект с обновленной XML-строкой и количеством обработанных таблиц.
 */
function convertTwoColumnTablesToTabbedParagraphs(xml, params) {
    if (!xml || xml.trim() === '')
        return { xml: '', changes: 0 };
    var tablesProcessedCount = 0;
    // Удаляем XML-декларацию для корректного парсинга JSDOM, как и в других функциях
    var cleanXml = xml.replace(/<\?xml[^>]*\?>\s*/, '');
    // Оборачиваем в dummy-тег с объявлением пространства имен, как в mergeInstructionTextRuns
    var wrappedXml = "<".concat(DUMMY_TAG, " xmlns:w=\"").concat(WORD_NAMESPACE, "\">").concat(cleanXml, "</").concat(DUMMY_TAG, ">");
    var dom = new jsdom_1.JSDOM(wrappedXml, { contentType: 'application/xml' });
    var doc = dom.window.document;
    // Используем getElementsByTagNameNS для поиска элементов в пространстве имен Word
    var tables = Array.from(doc.getElementsByTagNameNS(WORD_NAMESPACE, 'tbl'));
    var _loop_1 = function (table) {
        var rows = Array.from(table.getElementsByTagNameNS(WORD_NAMESPACE, 'tr'));
        // Проверяем, является ли таблица двухколоночной и имеет ли строки
        var isTwoColumnTable = rows.length > 0;
        if (isTwoColumnTable) {
            for (var _a = 0, rows_1 = rows; _a < rows_1.length; _a++) {
                var row = rows_1[_a];
                var cells = Array.from(row.getElementsByTagNameNS(WORD_NAMESPACE, 'tc'));
                if (cells.length !== 2) { // Строго две колонки
                    isTwoColumnTable = false;
                    break;
                }
            }
        }
        if (isTwoColumnTable) {
            tablesProcessedCount++;
            var generatedParagraphsForTable = [];
            var _loop_2 = function (row) {
                var cells = Array.from(row.getElementsByTagNameNS(WORD_NAMESPACE, 'tc'));
                // Передаем doc в extractRunsAndTextFlagFromCell для создания элементов
                var cell1Data = extractRunsAndTextFlagFromCell(cells[0], doc);
                var cell2Data = extractRunsAndTextFlagFromCell(cells[1], doc);
                var newParagraph = doc.createElementNS(WORD_NAMESPACE, 'w:p');
                // Применяем стиль "Tabular1"
                var pPr = doc.createElementNS(WORD_NAMESPACE, 'w:pPr');
                var pStyle = doc.createElementNS(WORD_NAMESPACE, 'w:pStyle');
                pStyle.setAttribute('w:val', TABLE_HEADER_STYLE_NAME);
                pPr.appendChild(pStyle);
                newParagraph.appendChild(pPr);
                // Добавляем первую табуляцию
                var tabRun1 = doc.createElementNS(WORD_NAMESPACE, 'w:r');
                tabRun1.appendChild(doc.createElementNS(WORD_NAMESPACE, 'w:tab')); // <w:tab/>
                newParagraph.appendChild(tabRun1);
                // Добавляем содержимое первой ячейки
                // Используем JSDOM для парсинга runsXml обратно в DOM-элементы и добавления в newParagraph
                if (cell1Data.hasText) {
                    var tempContainer = dom.window.document.createElement('div');
                    tempContainer.innerHTML = cell1Data.runsXml;
                    Array.from(tempContainer.children).forEach(function (child) {
                        newParagraph.appendChild(child.cloneNode(true));
                    });
                }
                // Добавляем вторую табуляцию
                var tabRun2 = doc.createElementNS(WORD_NAMESPACE, 'w:r');
                tabRun2.appendChild(doc.createElementNS(WORD_NAMESPACE, 'w:tab')); // <w:tab/>
                newParagraph.appendChild(tabRun2);
                // Добавляем содержимое второй ячейки
                if (cell2Data.hasText) {
                    var tempContainer = dom.window.document.createElement('div');
                    tempContainer.innerHTML = cell2Data.runsXml;
                    Array.from(tempContainer.children).forEach(function (child) {
                        newParagraph.appendChild(child.cloneNode(true));
                    });
                }
                generatedParagraphsForTable.push(newParagraph);
            };
            for (var _b = 0, rows_2 = rows; _b < rows_2.length; _b++) {
                var row = rows_2[_b];
                _loop_2(row);
            }
            // Заменяем таблицу на сгенерированные параграфы
            var parent_1 = table.parentNode;
            if (parent_1) {
                // Вставляем новые параграфы перед таблицей
                generatedParagraphsForTable.forEach(function (p) { return parent_1.insertBefore(p, table); });
                // Удаляем оригинальную таблицу
                parent_1.removeChild(table);
            }
        }
    };
    for (var _i = 0, tables_1 = tables; _i < tables_1.length; _i++) {
        var table = tables_1[_i];
        _loop_1(table);
    }
    var serializer = new dom.window.XMLSerializer();
    var serializedXml = serializer.serializeToString(doc.documentElement);
    // Очистка от оберточного тега dummy, как в mergeInstructionTextRuns
    var startTag = "<".concat(DUMMY_TAG, " xmlns:w=\"").concat(WORD_NAMESPACE, "\">");
    var endTag = "</".concat(DUMMY_TAG, ">");
    if (serializedXml.startsWith(startTag) && serializedXml.endsWith(endTag)) {
        serializedXml = serializedXml.substring(startTag.length, serializedXml.length - endTag.length);
    }
    // Мы не добавляем <?xml ...?> обратно, так как processor.ts занимается этим на корневом уровне.
    // Эта функция должна возвращать обработанный XML-фрагмент.
    return { xml: serializedXml, changes: tablesProcessedCount };
}
