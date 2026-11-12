/* Тексты примера: плейсхолдер, подсказка и пункты списка вместо «Text», «Hint text», «One»… из Figma.
   Меняется только содержимое демонстрации, вёрстка и стили компонентов ALTA не трогаются. */
(function () {
  if (!window.AltaUI) return;
  var register = AltaUI.register;
  var options = [['One', 'CYCLE_TASK', 'Циклический'], ['Two', 'CYCLE_TASK_1', 'Циклический'], ['Three', 'TRIGGER_TASK', 'По событию'], ['Four', 'EVENT_TASK', 'По событию'], ['Five', 'IDLE_TASK', 'Фоновый']];
  function swap(html, from, to) { return html.split('data-text="' + from + '">' + from + '<').join('data-text="' + to + '">' + to + '<'); }
  AltaUI.register = function (def) {
    def.variants.forEach(function (v) {
      var h = v.html;
      if (def.name === 'AltaIDE_Dropdown') {
        h = h.split('data-text="Text">Text<').join('data-text="Text">Выберите задачу<'); /* атрибут Text оставлен: по нему runtime подставляет выбранное значение */
        h = h.replace(/<div class="fn n-[0-9a-f]+" data-node="[^"]+"><span class="fn n-[0-9a-f]+ fn-text" data-node="[^"]+" data-text="Hint text">Hint text<\/span><\/div>/, '');
      }
      if (def.name === 'AltaIDE_DropdownOpen') {
        /* пункты по порядку: и в списке с описанием (One…Five), и в списке без описания (One ×5) */
        var k = 0, d = 0;
        h = h.replace(/data-text="(One|Two|Three|Four|Five)">(One|Two|Three|Four|Five)</g, function (m) {
          var o = options[k++ % options.length]; return 'data-text="' + o[1] + '">' + o[1] + '<';
        });
        h = h.replace(/data-text="Read Coils">Read Coils</g, function () {
          var o = options[d++ % options.length]; return 'data-text="' + o[2] + '">' + o[2] + '<';
        });
      }
      v.html = h;
    });
    if (def.name === 'AltaIDE_Dropdown') window.__ddVariants = def.variants;
    return register.apply(this, arguments);
  };
})();
