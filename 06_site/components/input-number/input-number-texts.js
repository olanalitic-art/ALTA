/* Значение примера: 10 вместо «0» из Figma. Меняется только содержимое демонстрации, стили ALTA не трогаются. */
(function () {
  if (!window.AltaUI) return;
  var register = AltaUI.register;
  AltaUI.register = function (def) {
    if (def.name === 'AltaIDE_InputNumber') def.variants.forEach(function (v) { v.html = v.html.split('data-text="0" data-edit-slot>0<').join('data-text="10" data-edit-slot>10<'); });
    return register.apply(this, arguments);
  };
})();
