# AltaIDE_Resize

Разделитель для изменения размера области.

Превью: [Открыть демонстрацию](https://olanalitic-art.github.io/ALTA/06_site/components/resize/preview.html)  
Источник: [AltaIDE/Resize, node 185649:32710](https://www.figma.com/design/axdKFZbeqNIfskP18KDs32/?node-id=185649-32710).  
Статус: реализовано, ожидает проверки дизайнером.  
Дизайн, переменные и варианты прочитаны 31.10.2026.

## Файлы

- `index.html` — отдельный пример.
- `preview.html` — карточка компонента.
- `resize.css` — измерения и привязки к токенам Figma.
- `resize.js` — подтверждённые конфигурации.
- `sidebar-resize.js` — ресайз сайдбара по требованиям.
- `assets/figma-source.json` — исходные свойства, размеры и зависимости.
- `assets/*.svg` — оригинальные ресурсы Figma.
- `../../../01_foundations/runtime/navigation.*` — общая логика и механика браузера.
- `../../../01_foundations/tokens/` и `../../../01_foundations/fonts/` — общие токены и шрифты.

В Figma нет переходов для разделителя. Перетаскивание и клавиши стрелок изменяют локальное демонстрационное значение; исходные размеры и внешний вид сохранены.

## Ресайз сайдбара

Разделитель между сайдбаром и центральной областью работает по требованиям [`07_docs/sidebar-resize.md`](../../../07_docs/sidebar-resize.md): сайдбар 248–420 px, по умолчанию 248 px, центр не уже 512 px, разделитель 10 px, приложение не уже 1380 px.

Логика лежит в `sidebar-resize.js`. Её подключают экраны и мастер-макет:

```html
<script src="../02_components/ide/AltaIDE_Resize/sidebar-resize.js"></script>
<script>
  AltaSidebarResize.attach({ panel: sidebarElement, splitter: resizeElement, side: 'left', app: appElement });
</script>
```

## Зафиксированные правила

Вертикальный разделитель шириной 10 px. Работает по требованиям к ресайзу сайдбаров. Полный список: [`07_docs/component-rules.md`](../../../07_docs/component-rules.md).
