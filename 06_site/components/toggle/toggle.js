// Visual state is driven by aria-checked / disabled and shared CSS tokens.
document.querySelectorAll('[data-toggle]:not([data-static])').forEach(button => {
  button.addEventListener('click', () => {
    button.setAttribute('aria-checked', String(button.getAttribute('aria-checked') !== 'true'));
    button.dispatchEvent(new CustomEvent('togglechange'));
  });
});
