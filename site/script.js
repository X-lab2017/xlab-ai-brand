const buttons = document.querySelectorAll('[data-theme]');
buttons.forEach(button => button.addEventListener('click', () => {
  const dark = button.dataset.theme === 'dark';
  document.querySelector('#gallery').classList.toggle('dark', dark);
  document.querySelectorAll('[data-logo]').forEach(img => {
    img.src = `assets/XlabAI_${img.dataset.logo}_${dark ? 'ColorDark' : 'ColorLight'}.svg`;
  });
  buttons.forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
}));
