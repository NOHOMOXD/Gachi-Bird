import './style.css';
import { Game } from './core/Game';

window.addEventListener('DOMContentLoaded', async () => {
  const game = new Game();
  await game.init();
});
