/* «Пример работы»: настоящий AltaIDE_InputNumber с общей логикой ALTA (assets/alta/runtime.js). */
(function () {
  var root = document.getElementById('in-demo'), status = document.getElementById('in-status');
  var stateSelect = document.getElementById('in-state'), resetButton = document.getElementById('in-reset');
  if (!root || !window.AltaUI) return;
  AltaUI.demo(root, status, resetButton);
  var index = { Default: 1, Invalid: 5, Disabled: 4 };
  var text = { Default: 'Нажмите на поле, чтобы изменить значение', Invalid: 'Пример ошибки: значение вне диапазона', Disabled: 'Редактирование недоступно' };
  stateSelect.addEventListener('change', function () {
    AltaUI.setVariant(root, index[stateSelect.value]);
    status.textContent = text[stateSelect.value];
  });
  resetButton.addEventListener('click', function () {
    stateSelect.value = 'Default';
    setTimeout(function () { status.textContent = text.Default; }, 0);
  });
})();
