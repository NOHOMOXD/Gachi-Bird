import { AnimatedSprite, TilingSprite, Texture } from 'pixi.js';
import { GAME_CONFIG } from '../config';

export class Background {
  public bgSprite: AnimatedSprite;
  public ground: TilingSprite;

  constructor(billyTextures: Texture[], groundTexture: Texture) {
    // 1. Billy animated background
    this.bgSprite = new AnimatedSprite(billyTextures);
    this.bgSprite.width = GAME_CONFIG.WIDTH;
    this.bgSprite.height = GAME_CONFIG.HEIGHT - 40;
    this.bgSprite.animationSpeed = GAME_CONFIG.BILLY_BG_FPS / 60;
    this.bgSprite.play();

    // 2. Tiling Ground (rendered in front of lockers so lockers enter ground cleanly)
    const groundH = GAME_CONFIG.GROUND_HEIGHT;
    this.ground = new TilingSprite({
      texture: groundTexture,
      width: GAME_CONFIG.WIDTH,
      height: groundH,
    });
    this.ground.y = GAME_CONFIG.HEIGHT - groundH;
  }

  public update(dt: number, isPlaying: boolean) {
    if (isPlaying) {
      this.ground.tilePosition.x -= GAME_CONFIG.LOCKER_SPEED * dt;
    }
  }

  public getGroundY(): number {
    return this.ground.y;
  }
}
