import '../sass/style.scss';

document.getElementById('burgerBtn')?.addEventListener('click', () => {
  document.getElementById('mainNav')?.classList.toggle('is-open');
});