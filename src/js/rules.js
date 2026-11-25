import '../sass/style.scss';
import { syncGlobalSettings } from './sheets-api.js';

syncGlobalSettings();

document.getElementById('burgerBtn')?.addEventListener('click', () => {
  document.getElementById('mainNav')?.classList.toggle('is-open');
});