import { Container, AnimatedSprite, Texture } from 'pixi.js';
import { GAME_CONFIG } from '../config';

export class Bird extends Container {
  private sprite: AnimatedSprite;
  public vy: number = 0;
  private targetRotation: number = 0;
  public isDead: boolean = false;

  constructor(textures: Texture[]) {
    super();

    this.sprite = new AnimatedSprite(textures);
    this.sprite.anchor.set(0.5, 0.5);
    // 50 FPS animation speed based on 60 FPS standard ticker
    this.sprite.animationSpeed = GAME_CONFIG.BILLY_HEAD_FPS / 60;
    this.sprite.play();

    this.addChild(this.sprite);
    this.reset();
  }

  public reset() {
    this.x = GAME_CONFIG.BIRD_X;
    this.y = GAME_CONFIG.BIRD_START_Y;
    this.vy = 0;
    this.rotation = 0;
    this.targetRotation = 0;
    this.isDead = false;
    this.sprite.play();
  }

  public flap() {
    if (this.isDead) return;
    this.vy = -GAME_CONFIG.JUMP_FORCE;
    this.targetRotation = GAME_CONFIG.ROTATION_UP;
  }

  public update(dt: number) {
    if (this.isDead) return;

    // Apply gravity
    this.vy += GAME_CONFIG.GRAVITY * dt;
    this.vy = Math.min(this.vy, GAME_CONFIG.MAX_FALL_SPEED);
    this.y += this.vy * dt;

    // Smooth rotation based on vertical speed
    if (this.vy < 0) {
      // Pitching up
      this.targetRotation = GAME_CONFIG.ROTATION_UP;
      this.rotation += (this.targetRotation - this.rotation) * Math.min(1, GAME_CONFIG.ROTATION_SMOOTH_UP * dt);
    } else if (this.vy > 80) {
      // Diving down
      this.targetRotation = GAME_CONFIG.ROTATION_DOWN;
      this.rotation += (this.targetRotation - this.rotation) * Math.min(1, GAME_CONFIG.ROTATION_SMOOTH_DOWN * dt);
    }
  }

  public getHitbox() {
    // Return fair bounding box inset from the sprite boundaries
    const w = this.sprite.width - GAME_CONFIG.HITBOX_INSET_X * 2;
    const h = this.sprite.height - GAME_CONFIG.HITBOX_INSET_Y * 2;
    return {
      x: this.x - w / 2,
      y: this.y - h / 2,
      width: w,
      height: h,
    };
  }

  public die() {
    this.isDead = true;
    this.sprite.stop();
  }
}
