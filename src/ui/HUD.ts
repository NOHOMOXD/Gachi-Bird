import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { GAME_CONFIG } from '../config';

export interface HUDCallbacks {
  onToggleMute: () => boolean;
  onToggleFullscreen: () => void;
  getIsMuted: () => boolean;
}

export class HUD extends Container {
  private scoreText: Text;
  private muteBtn: Container;
  private muteSpeaker: Graphics;
  private muteWave: Graphics;
  private fsBtn: Container;
  private hintText: Text;

  constructor(callbacks: HUDCallbacks) {
    super();

    // Default hidden until game is ready/playing
    this.visible = false;

    // 1. In-game score in top-left, vertically aligned with buttons (no heavy background block)
    const btnSize = 36;
    const topBarY = 12;
    const centerY = topBarY + btnSize / 2;

    this.scoreText = new Text({
      text: 'SCORE: 0',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 20,
        fontWeight: 'bold',
        fill: '#facc15',
        stroke: { color: '#000000', width: 4 },
        dropShadow: {
          alpha: 0.8,
          blur: 0,
          distance: 2,
        },
        letterSpacing: 1,
      }),
    });
    this.scoreText.anchor.set(0, 0.5);
    this.scoreText.x = 16;
    this.scoreText.y = centerY;
    this.addChild(this.scoreText);

    // 2. Control buttons in top-right (8-bit style)
    // Fullscreen button
    this.fsBtn = new Container();
    this.fsBtn.x = GAME_CONFIG.WIDTH - btnSize - 12;
    this.fsBtn.y = topBarY;
    this.fsBtn.eventMode = 'static';
    this.fsBtn.cursor = 'pointer';

    const fsBg = new Graphics();
    fsBg.rect(2, 0, btnSize - 4, btnSize);
    fsBg.rect(0, 2, btnSize, btnSize - 4);
    fsBg.fill({ color: 0x000000 });
    fsBg.rect(2, 2, btnSize - 4, btnSize - 4);
    fsBg.fill({ color: 0x1e293b });
    fsBg.rect(2, 2, btnSize - 4, 1);
    fsBg.rect(2, 2, 1, btnSize - 4);
    fsBg.fill({ color: 0x64748b });
    this.fsBtn.addChild(fsBg);

    const fsIcon = new Text({
      text: '⛶',
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 18,
        fontWeight: 'bold',
        fill: '#ffffff',
      }),
    });
    fsIcon.anchor.set(0.5, 0.5);
    fsIcon.x = btnSize / 2;
    fsIcon.y = btnSize / 2;
    this.fsBtn.addChild(fsIcon);
    this.fsBtn.on('pointerdown', callbacks.onToggleFullscreen);
    this.addChild(this.fsBtn);

    // Mute button
    this.muteBtn = new Container();
    this.muteBtn.x = GAME_CONFIG.WIDTH - btnSize * 2 - 20;
    this.muteBtn.y = topBarY;
    this.muteBtn.eventMode = 'static';
    this.muteBtn.cursor = 'pointer';

    const muteBg = new Graphics();
    muteBg.rect(2, 0, btnSize - 4, btnSize);
    muteBg.rect(0, 2, btnSize, btnSize - 4);
    muteBg.fill({ color: 0x000000 });
    muteBg.rect(2, 2, btnSize - 4, btnSize - 4);
    muteBg.fill({ color: 0x1e293b });
    muteBg.rect(2, 2, btnSize - 4, 1);
    muteBg.rect(2, 2, 1, btnSize - 4);
    muteBg.fill({ color: 0x64748b });
    this.muteBtn.addChild(muteBg);

    this.muteSpeaker = new Graphics();
    this.muteWave = new Graphics();
    this.muteBtn.addChild(this.muteSpeaker);
    this.muteBtn.addChild(this.muteWave);

    this.drawMuteIcon(callbacks.getIsMuted());

    this.muteBtn.on('pointerdown', () => {
      const isMuted = callbacks.onToggleMute();
      this.drawMuteIcon(isMuted);
    });
    this.addChild(this.muteBtn);

    // 3. Flap prompt hint (only shown in READY mode)
    this.hintText = new Text({
      text: 'TAP / SPACE TO FLAP',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 15,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: { color: '#000000', width: 4 },
        dropShadow: {
          alpha: 0.7,
          blur: 0,
          distance: 2,
        },
        letterSpacing: 1,
      }),
    });
    this.hintText.anchor.set(0.5, 0.5);
    this.hintText.x = GAME_CONFIG.WIDTH / 2;
    this.hintText.y = GAME_CONFIG.HEIGHT / 2 + 50;
    this.hintText.visible = false;
    this.addChild(this.hintText);
  }

  public setScore(score: number) {
    this.scoreText.text = `SCORE: ${score}`;
  }

  public showHint(show: boolean) {
    this.hintText.visible = show;
  }

  public setMuted(muted: boolean) {
    this.drawMuteIcon(muted);
  }

  private drawMuteIcon(muted: boolean) {
    this.muteSpeaker.clear();
    this.muteWave.clear();

    // 1. Speaker body
    this.muteSpeaker.rect(9, 14, 5, 8);
    this.muteSpeaker.fill({ color: 0xffffff });

    this.muteSpeaker.poly([
      { x: 14, y: 14 },
      { x: 20, y: 10 },
      { x: 20, y: 26 },
      { x: 14, y: 22 },
    ]);
    this.muteSpeaker.fill({ color: 0xffffff });

    // 2. Sound waves or mute slash
    if (muted) {
      this.muteWave.moveTo(8, 8);
      this.muteWave.lineTo(28, 28);
      this.muteWave.stroke({ color: 0xef4444, width: 2.5 });
    } else {
      this.muteWave.arc(19, 18, 5, -Math.PI / 3, Math.PI / 3);
      this.muteWave.stroke({ color: 0x38bdf8, width: 2 });

      this.muteWave.arc(19, 18, 8, -Math.PI / 3, Math.PI / 3);
      this.muteWave.stroke({ color: 0x38bdf8, width: 2 });
    }
  }
}
