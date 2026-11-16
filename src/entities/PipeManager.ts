import { Container, Sprite, Texture, TilingSprite } from 'pixi.js';
import { GAME_CONFIG } from '../config';

export interface LockerPair {
  container: Container;
  topLocker: Container;
  bottomLocker: Container;
  x: number;
  gapY: number;
  gapHeight: number;
  width: number;
  passed: boolean;
}

export class PipeManager extends Container {
  private lockerTexture: Texture;
  private lockerBodyTexture: Texture;
  private lockers: LockerPair[] = [];
  private lastGapY: number = 200;
  private groundY: number = 520;

  public onScore?: () => void;

  constructor(lockerTexture: Texture, lockerBodyTexture: Texture, groundY: number) {
    super();
    this.lockerTexture = lockerTexture;
    this.lockerBodyTexture = lockerBodyTexture;
    this.groundY = groundY;
    this.reset();
  }

  public reset() {
    for (const locker of this.lockers) {
      this.removeChild(locker.container);
      locker.container.destroy({ children: true });
    }
    this.lockers = [];

    const playableH = this.groundY - GAME_CONFIG.LOCKER_GAP;
    this.lastGapY = Math.floor(playableH / 2);

    this.spawnLocker(GAME_CONFIG.WIDTH + GAME_CONFIG.FIRST_LOCKER_DELAY_X);
  }

  private spawnLocker(startX: number) {
    const minSafeGap = GAME_CONFIG.LOCKER_MIN_TOP;
    const maxSafeGap = this.groundY - GAME_CONFIG.LOCKER_GAP - GAME_CONFIG.LOCKER_MIN_BOTTOM;

    const minGap = Math.max(minSafeGap, this.lastGapY - GAME_CONFIG.LOCKER_MAX_DELTA_Y);
    const maxGap = Math.min(maxSafeGap, this.lastGapY + GAME_CONFIG.LOCKER_MAX_DELTA_Y);

    const gapY = Math.floor(minGap + Math.random() * (maxGap - minGap));
    this.lastGapY = gapY;

    const container = new Container();
    container.x = startX;

    const lockerW = GAME_CONFIG.LOCKER_WIDTH;
    const lockerH = GAME_CONFIG.LOCKER_HEIGHT;
    const OVERLAP = 4; // 4px overlap eliminates any sub-pixel rendering gap

    // 1. Top Locker (hangs down to gapY with vents facing gap)
    const topLocker = new Container();
    const topSprite = new Sprite(this.lockerTexture);
    topSprite.width = lockerW;
    topSprite.height = lockerH;
    topSprite.scale.y = -1;
    topSprite.position.set(0, gapY);

    if (gapY > lockerH) {
      // Seamless extension from ceiling to topSprite with 4px overlap
      const topExtension = new TilingSprite({
        texture: this.lockerBodyTexture,
        width: lockerW,
        height: (gapY - lockerH) + OVERLAP + 10,
      });
      topExtension.position.set(0, -10);
      topLocker.addChild(topExtension);
    }
    topLocker.addChild(topSprite);
    container.addChild(topLocker);

    // 2. Bottom Locker (starts at bottomY and extends into ground with 4px overlap)
    const bottomLocker = new Container();
    const bottomY = gapY + GAME_CONFIG.LOCKER_GAP;
    const bottomHeightNeeded = this.groundY - bottomY;

    const bottomSprite = new Sprite(this.lockerTexture);
    bottomSprite.width = lockerW;
    bottomSprite.height = lockerH; // Natural 1:1 scale, never squashed
    bottomSprite.position.set(0, bottomY);

    if (bottomHeightNeeded > lockerH) {
      // Seamless extension with 4px overlap down into ground
      const extY = bottomY + lockerH - OVERLAP;
      const extH = (this.groundY + 30) - extY;

      const bottomExtension = new TilingSprite({
        texture: this.lockerBodyTexture,
        width: lockerW,
        height: extH,
      });
      bottomExtension.position.set(0, extY);
      bottomLocker.addChild(bottomExtension);
    }
    bottomLocker.addChild(bottomSprite);
    container.addChild(bottomLocker);

    this.addChild(container);

    this.lockers.push({
      container,
      topLocker,
      bottomLocker,
      x: startX,
      gapY,
      gapHeight: GAME_CONFIG.LOCKER_GAP,
      width: lockerW,
      passed: false,
    });
  }

  public update(dt: number, birdX: number) {
    const moveDist = GAME_CONFIG.LOCKER_SPEED * dt;

    for (let i = this.lockers.length - 1; i >= 0; i--) {
      const locker = this.lockers[i];
      locker.x -= moveDist;
      locker.container.x = locker.x;

      if (!locker.passed && locker.x + locker.width < birdX) {
        locker.passed = true;
        if (this.onScore) {
          this.onScore();
        }
      }

      if (locker.x + locker.width < -10) {
        this.removeChild(locker.container);
        locker.container.destroy({ children: true });
        this.lockers.splice(i, 1);
      }
    }

    const rightmost = this.lockers[this.lockers.length - 1];
    if (rightmost && rightmost.x <= GAME_CONFIG.WIDTH + 50 - GAME_CONFIG.LOCKER_SPACING) {
      this.spawnLocker(rightmost.x + GAME_CONFIG.LOCKER_SPACING);
    }
  }

  public checkCollision(birdBox: { x: number; y: number; width: number; height: number }): boolean {
    for (const locker of this.lockers) {
      const lockerLeft = locker.x;
      const lockerRight = locker.x + locker.width;

      const birdLeft = birdBox.x;
      const birdRight = birdBox.x + birdBox.width;
      const birdTop = birdBox.y;
      const birdBottom = birdBox.y + birdBox.height;

      if (birdRight > lockerLeft && birdLeft < lockerRight) {
        if (birdTop < locker.gapY) {
          return true;
        }
        if (birdBottom > locker.gapY + locker.gapHeight) {
          return true;
        }
      }
    }
    return false;
  }
}
