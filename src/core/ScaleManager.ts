import { GAME_CONFIG } from '../config';

export class ScaleManager {
  private canvas: HTMLCanvasElement;
  public scale: number = 1;
  public isFullscreen: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.init();
  }

  private init() {
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
      this.resize();
    });
    this.resize();
  }

  public resize() {
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;

    const scaleX = windowW / GAME_CONFIG.WIDTH;
    const scaleY = windowH / GAME_CONFIG.HEIGHT;
    this.scale = Math.min(scaleX, scaleY);

    const displayW = Math.floor(GAME_CONFIG.WIDTH * this.scale);
    const displayH = Math.floor(GAME_CONFIG.HEIGHT * this.scale);

    this.canvas.style.width = `${displayW}px`;
    this.canvas.style.height = `${displayH}px`;
  }

  public toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }
}
