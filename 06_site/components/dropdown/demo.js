/* «Пример работы»: настоящий AltaIDE_Dropdown с общей логикой ALTA (assets/alta/runtime.js). */
(function () {
  var root = document.getElementById('dd-demo'), status = document.getElementById('dd-status');
  var stateSelect = document.getElementById('dd-state'), resetButton = document.getElementById('dd-reset');
  if (!root || !window.AltaUI) return;
  /* В строке списка есть название и описание; в поле подставляем только название задачи */
  root.addEventListener('alta-select', function (e) {
    var rows = root.querySelectorAll('[data-option]'), row = rows[e.detail.index];
    var name = row && row.querySelector('[data-text]');
    if (name) e.detail.value = name.textContent.trim();
  }, true);

  /* При повторном открытии списка выбранный пункт подсвечен */
  var chosenIndex = -1;
  root.addEventListener('alta-select', function (e) { if (e.detail && typeof e.detail.index === 'number') chosenIndex = e.detail.index; }, true);
  new MutationObserver(function () {
    var popup = root.querySelector(':scope > .alta-popup');
    if (!popup || chosenIndex < 0 || popup.dataset.marked) return;
    popup.dataset.marked = 'true';
    var rows = popup.querySelectorAll('[data-option]'), row = rows[chosenIndex];
    if (!row) return;
    rows.forEach(function (r) { r.classList.remove('is-active'); r.dataset.active = 'false'; r.setAttribute('aria-selected', 'false'); });
    row.classList.add('is-active'); row.dataset.active = 'true'; row.setAttribute('aria-selected', 'true');
    if (row.id) root.setAttribute('aria-activedescendant', row.id);
  }).observe(root, { childList: true });
  AltaUI.demo(root, status, resetButton);
  var chosen = '';
  ['alta-select', 'alta-change'].forEach(function (type) {
    root.addEventListener(type, function (e) { if (e.detail && e.detail.value) { chosen = String(e.detail.value); status.textContent = 'Выбрано: ' + chosen; } });
  });
  var size = 'L';
  function find(state) {
    var idx = -1;
    window.__ddVariants.forEach(function (v, i) { if (v.props.State === state && v.props.Size === size) idx = i; });
    return idx;
  }
  function apply() {
    var i = find(stateSelect.value === 'Default' && chosen ? 'Selected' : stateSelect.value);
    if (i >= 0) AltaUI.setVariant(root, i);
    var field = root.querySelector('[data-text="Text"]');
    if (field && chosen && stateSelect.value !== 'Loading' && stateSelect.value !== 'Disable') field.textContent = chosen;
    document.getElementById('dd-width').textContent = size === 'M' ? '162 px' : '248 px';
    if (stateSelect.value === 'Default' && chosen) { status.textContent = 'Выбрано: ' + chosen; return; }
    status.textContent = { Default: 'Нажмите на поле, чтобы открыть список', Invalid: 'Пример ошибки выбора', Loading: 'Список загружается', Disable: 'Выбор недоступен' }[stateSelect.value];
  }
  document.querySelectorAll('.segments [data-size]').forEach(function (b) {
    b.addEventListener('click', function () {
      size = b.dataset.size;
      document.querySelectorAll('.segments [data-size]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      apply();
    });
  });
  stateSelect.addEventListener('change', apply);
  resetButton.addEventListener('click', function () {
    chosenIndex = -1;
    size = 'L'; chosen = ''; stateSelect.value = 'Default';
    document.querySelectorAll('.segments [data-size]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.size === 'L')); });
    document.getElementById('dd-width').textContent = '248 px';
    status.textContent = 'Нажмите на поле, чтобы открыть список';
  });
})();
