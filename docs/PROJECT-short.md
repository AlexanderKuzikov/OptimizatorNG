# Проект: Optimizator Next Gen
## 1. Миссия проекта

Десктопное приложение на Electron + TypeScript для оптимизации и стандартизации шаблонов документов (DOCX/FDT).

**Ключевые особенности:**

- Атомарная архитектура обработки
- Динамический UI на основе config.json
- Гибкая конфигурация без изменения кода
- GitHub-портфолио с высоким качеством кода

## 2. Стек технологий

- **Фреймворк:** Electron
- **Язык:** TypeScript (strict mode)
- **Тестирование:** Jest
- **Сборка:** tsc (для main/preload), esbuild (для renderer), electron-builder
- **Зависимости:** adm-zip, jsdom
- **Среда:** VS Code, Git (GitHub)
- **Node.js:** LTS версия

## 3. Архитектурные принципы

### Единый источник истины

Вся конфигурация в config.json:

- Логика обработки (processingSteps)
- Глобальные настройки документов (documentSettings)
- Тема интерфейса (themeSettings)

### Трёхуровневая архитектура

**Shell (Оболочка):**

- Работа с файловой системой
- Нормализатор: fdt/docx → docx
- Распаковщик/Запаковщик: docx ↔ xml
- Отладочные инструменты

**Orchestrator (Оркестратор):**

- Управление процессом обработки
- Чтение и интерпретация config.json
- Последовательный вызов операций Core
- Передача данных между слоями

**Core (Ядро):**

- Чистые функции обработки XML
- Каждая операция = отдельный файл
- Вход/выход: XML-строка
- Операция: одна задача (обычно RegExp)
- Без побочных эффектов (immutable)

### Динамический UI

- Генерируется на основе метаданных из config.json
- Три уровня доступа:
  - **User:** Минималистичный. Выбор файлов + запуск.
  - **Developer:** Настройка шагов обработки (processingSteps)
  - **Settings:** Глобальные настройки документа (documentSettings)
- Добавление новой функции в config = автоматическое отображение в UI

## 4. Структура config.json

Три корневых свойства: themeSettings, documentSettings, processingSteps

**Структура атома (операции):**

Каждый шаг описывается JSON-объектом с полями id (идентификатор модуля), name (отображаемое имя), description (описание для подсказок), enabled (состояние по умолчанию), ui с подполями view (уровень доступа Developer или Settings), group (группировка в интерфейсе), type (тип элемента управления boolean, object, array), и params (параметры функции).

**Поля:**

- id — уникальный идентификатор, совпадает с именем модуля
- name — человекочитаемое имя для UI
- description — краткое описание для подсказки
- enabled — включена ли операция по умолчанию
- ui.view — уровень доступа ('Developer' или 'Settings')
- ui.group — группировка в интерфейсе
- ui.type — тип элемента управления ('boolean', 'object', 'array')
- params — параметры, передаваемые в функцию

## 5. Технические регламенты

### IPC-протокол (Main ↔ Renderer)

**Запуск обработки (Renderer → Main):**

Вызов window.api.startProcessing с массивом путей к файлам как параметр.

**Обновление статуса (Main → Renderer):**

Канал update-status отправляет payload с полями message (текст статуса), step (название текущего шага) и опциональным progress (процент выполнения).

### Обработка ошибок

- **Пакетный режим:** При ошибке в одном файле — логируем, пропускаем, продолжаем обработку следующего
- **Детальное логирование:** Контекст ошибки для отладки
- **Уведомление пользователя:** Понятное сообщение о проблеме

### Валидация и безопасность

- **Входные данные:** Проверка размера файла, формата, структуры XML
- **IPC:** Whitelist разрешённых каналов в preload, проверка payload в main
- **Пути к файлам:** Защита от path traversal атак
- **contextIsolation:** Включено (true)
- **nodeIntegration:** Выключено (false) в renderer

## 6. Структура проекта

    OptimizatorNG/
    ├─ .markdownlint.json           # Настройки линтера Markdown (отключены строгие правила)
    ├─ config.json                  # Конфигурация шагов обработки (единый источник истины)
    ├─ docs/                        # Документация проекта
    │  ├─ DEV_LOG.md                # История архитектурных решений и проблем
    │  ├─ Glossary.md               # Глоссарий терминов проекта
    │  ├─ Initial Project Prompt.md # Исходное техническое задание
    │  ├─ modules-breakdown.mmd     # Kanban-диаграмма: декомпозиция по модулям
    │  ├─ project-status.mmd        # Kanban-диаграмма: общий статус проекта
    │  ├─ PROJECT.md                # Описание структуры проекта (этот файл)
    │  ├─ PROMPT.md                 # Универсальный промпт для AI-ассистентов
    │  ├─ schema.mermaid            # Схема архитектуры системы
    │  └─ tree.txt                  # Сырое дерево файлов (генерируется автоматически)
    ├─ index.html                   # Главная страница приложения (UI разметка)
    ├─ jest.config.js               # Конфигурация Jest для тестирования
    ├─ LICENSE                      # Лицензия проекта
    ├─ package-lock.json            # Зафиксированные версии зависимостей
    ├─ package.json                 # NPM метаданные, зависимости и скрипты
    ├─ README.md                    # Главный README проекта (для GitHub)
    ├─ src/                         # Исходный код приложения
    │  ├─ core/                     # Ядро обработки DOCX
    │  │  ├─ processor.ts           # Оркестратор: управление конвейером обработки
    │  │  └─ steps/                 # Атомарные функции обработки
    │  │     ├─ applyStyles.test.ts        # Unit-тест для applyStyles
    │  │     ├─ applyStyles.ts             # Замена файла styles.xml на эталонный
    │  │     ├─ assimilateSpaceRuns.test.ts # Unit-тест для assimilateSpaceRuns (jsdom)
    │  │     ├─ assimilateSpaceRuns.ts     # Ассимиляция одиночных пробелов (jsdom)
    │  │     ├─ cleanupDocumentStructure.test.ts     # Unit-тест для cleanupGarbage
    │  │     ├─ cleanupDocumentStructure.ts# Удаление "мусорных" тегов
    │  │     ├─ cleanupParaProps.test.ts   # Unit-тест для cleanupParaProps (jsdom)
    │  │     ├─ cleanupParaProps.ts        # Очистка свойств параграфа (jsdom)
    │  │     ├─ mergeConsecutiveRuns.test.ts # Unit-тест для mergeConsecutiveRuns (jsdom)
    │  │     ├─ mergeConsecutiveRuns.ts    # Объединение текстовых блоков (jsdom)
    │  │     ├─ mergeInstructionTextRuns.test.ts # Unit-тест для mergeInstructionTextRuns (jsdom)
    │  │     ├─ mergeInstructionTextRuns.ts# Объединение блоков инструкций (jsdom)
    │  │     ├─ removeDuplicateSpaces.test.ts
    │  │     ├─ removeDuplicateSpaces.ts   # Удаление двойных пробелов (RegExp)
    │  │     ├─ removeFonts.test.ts
    │  │     ├─ removeFonts.ts             # Удаление блоков <w:fonts>
    │  │     ├─ removeFontSize.test.ts
    │  │     ├─ removeFontSize.ts          # Удаление атрибутов размера шрифта, курсива, подчеркивания (RegExp)
    │  │     ├─ removeIndentation.test.ts
    │  │     ├─ removeIndentation.ts       # Удаление отступов <w:ind>
    │  │     ├─ removeParagraphSpacing.test.ts
    │  │     ├─ removeParagraphSpacing.ts  # Удаление межабзацных интервалов <w:spacing>
    │  │     ├─ removeStyles.test.ts
    │  │     ├─ removeStyles.ts            # Удаление ссылок на стили <w:pStyle>, <w:rStyle>
    │  │     ├─ removeTextColor.test.ts
    │  │     ├─ removeTextColor.ts         # Удаление цвета текста и фона (RegExp)
    │  │     ├─ removeTrailingSpaces.test.ts
    │  │     ├─ removeTrailingSpaces.ts    # Удаление пробелов в конце строк
    │  │     ├─ replaceSpaceWithNbspAfterNumbering.test.ts # Unit-тест для replaceSpaceWithNbspAfterNumbering (jsdom)
    │  │     ├─ replaceSpaceWithNbspAfterNumbering.ts # Финальная обработка пробелов (jsdom)
    │  │     ├─ setPageMargins.test.ts
    │  │     └─ setPageMargins.ts          # Установка полей страницы (замена <w:sectPr>)
    │  ├─ main.ts                  # Main процесс Electron (IPC handlers, window management)
    │  ├─ preload.ts               # Preload скрипт (безопасный IPC bridge)
    │  ├─ renderer.ts              # Renderer процесс (UI логика, обработка событий)
    │  └─ templates/               # XML шаблоны для форматирования
    │     ├─ default-sectPr.xml    # Настройки разделов документа (поля, ориентация)
    │     └─ default-styles.xml    # Эталонный файл стилей Word
    ├─ tsconfig.json                # TypeScript: общая базовая конфигурация
    ├─ tsconfig.main.json           # TypeScript: конфигурация для main процесса
    └─ tsconfig.renderer.json       # TypeScript: конфигурация для renderer процесса

**Примечания к структуре:**

- **Тесты рядом с кодом:** Каждый .ts файл в /steps имеет парный .test.ts (паттерн colocation)
- **Три конфига TypeScript:** Разделение для main/renderer процессов Electron с разными целевыми окружениями
- **Отсутствует /dist:** Собранные файлы не коммитятся в Git (добавлены в .gitignore)
- **Отсутствует /node_modules:** Зависимости устанавливаются через npm install
- **Отсутствуют /IN и /OUT:** Временные папки создаются динамически при обработке

## 7. Специфичные требования к коду

### Модули Core (src/core/steps/)

**Шаблон функции:**

Каждая функция документируется блоком комментариев с указанием назначения, входных и выходных данных (обычно XML-строка), инвариантов (чистая функция, валидный XML на выходе) и граничных случаев. Функция должна быть чистой без изменения исходных данных, детерминированной с одинаковым результатом для одинакового входа, без внешних зависимостей кроме стандартных библиотек и без состояния. Размер обычно 10-30 строк, одна функция решает одну задачу.

**Новые JSDOM-функции:**

- **assimilateSpaceRuns:** Ассимиляция одиночных пробелов в предыдущий текстовый блок.
- **cleanupParaProps:** Очистка некорректных и избыточных свойств параграфов.
- **mergeConsecutiveRuns:** Объединение последовательных текстовых блоков (<w:t>) с одинаковым форматированием.
- **mergeInstructionTextRuns:** Объединение последовательных блоков инструкций (<w:instrText>).
- **replaceSpaceWithNbspAfterNumbering:** Финальная обработка пробелов, включая замену на неразрывные и проставление `xml:space="preserve"`.
