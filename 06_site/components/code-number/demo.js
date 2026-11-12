/* «Пример работы»: настоящий компонент ALTA с его собственной логикой. */
(function () {
  var root = document.getElementById('cp-demo'), status = document.getElementById('cp-status');
  var select = document.getElementById('cp-state'), resetButton = document.getElementById('cp-reset');
  if (!root) return;
  var api = window.AltaUI && root.classList.contains('alta-component') ? window.AltaUI
    : root.classList.contains('alta-widget') ? window.AltaWidgets
    : root.classList.contains('alta-control') ? window.AltaControls
    : root.classList.contains('cfc-component') ? window.AltaCFC
    : root.classList.contains('shell-component') ? window.AltaShell
    : root.classList.contains('ace-component') ? window.AltaCodeEditor : null;
  var options = JSON.parse(select.dataset.options);
  function applyButton(props) {
    root.dataset.state = props.State === 'Disabled' ? 'Default' : props.State;
    root.disabled = props.State === 'Disabled';
    if (props.Icon) root.dataset.icon = props.Icon;
    var st = props.State === 'Loading' ? 'Default' : props.State;
    root.querySelectorAll('[data-asset-state]').forEach(function (img) { img.classList.toggle('is-current', img.dataset.assetState === st); });
    if (props.State === 'Loading') root.setAttribute('aria-busy', 'true'); else root.removeAttribute('aria-busy');
  }
  function apply() {
    var o = options[select.selectedIndex];
    if (root.classList.contains('alta-button')) { applyButton(o.props); status.textContent = o.label; return; }
    if (api === window.AltaUI) api.setVariant(root, o.index);
    else if (api && api.setProperties) api.setProperties(root, o.props);
    else if (api === window.AltaCodeEditor) api.choose(root, o.props);
    status.textContent = o.label;
  }
  select.addEventListener('change', apply);
  resetButton.addEventListener('click', function () {
    try { if (api && api.reset) api.reset(root); } catch (e) {}
    select.selectedIndex = 0; apply();
  });
  ['alta-select', 'alta-change', 'input', 'click'].forEach(function (type) {
    root.addEventListener(type, function (e) {
      var v = e.detail && e.detail.value;
      if (v) status.textContent = 'Выбрано: ' + v;
    });
  });
})();
