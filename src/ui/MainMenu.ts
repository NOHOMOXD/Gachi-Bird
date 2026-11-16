import { Container, Graphics, Text, TextStyle, Sprite, Texture } from 'pixi.js';
import { Button } from './Button';
import { GAME_CONFIG } from '../config';

export interface MainMenuCallbacks {
  onStart: () => void;
  onSettings: () => void;
  onAbout: () => void;
}

export class MainMenu extends Container {
  private highScoreText: Text;

  constructor(callbacks: MainMenuCallbacks, rainbowTexture?: Texture) {
    super();

    const panelW = 270;
    const panelH = 340;

    this.x = (GAME_CONFIG.WIDTH - panelW) / 2;
    this.y = (GAME_CONFIG.HEIGHT - panelH) / 2 - 20;

    // 1. 8-Bit Retro Card Background
    const bg = new Graphics();
    // Black outer border with stepped corners
    bg.rect(4, 0, panelW - 8, panelH);
    bg.rect(0, 4, panelW, panelH - 8);
    bg.fill({ color: 0x000000 });

    // Gold arcade border
    bg.rect(4, 4, panelW - 8, panelH - 8);
    bg.fill({ color: 0xd97706 });

    // Inner dark container
    bg.rect(8, 8, panelW - 16, panelH - 16);
    bg.fill({ color: 0x121220 });

    // Highlight edge
    bg.rect(8, 8, panelW - 16, 2);
    bg.rect(8, 8, 2, panelH - 16);
    bg.fill({ color: 0xfef08a, alpha: 0.7 });

    this.addChild(bg);

    // 2. Natural 7-color pixel rainbow banner
    if (rainbowTexture) {
      const rainbow = new Sprite(rainbowTexture);
      rainbow.width = panelW - 24;
      rainbow.height = 30;
      rainbow.x = 12;
      rainbow.y = 12;
      this.addChild(rainbow);
    }

    // 3. 8-Bit Title
    const title = new Text({
      text: 'GACHI BIRD',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 28,
        fontWeight: 'bold',
        fill: '#facc15',
        stroke: { color: '#000000', width: 5 },
        letterSpacing: 2,
      }),
    });
    title.anchor.set(0.5, 0);
    title.x = panelW / 2;
    title.y = 50;
    this.addChild(title);

    // Subtitle
    const subtitle = new Text({
      text: '★ ANIKI EDITION ★',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: '#38bdf8',
        letterSpacing: 1,
      }),
    });
    subtitle.anchor.set(0.5, 0);
    subtitle.x = panelW / 2;
    subtitle.y = 86;
    this.addChild(subtitle);

    // 4. Retro Buttons (Donation removed completely)
    const btnW = 200;
    const btnH = 46;
    const startY = 120;
    const gap = 56;

    const btnStart = new Button({
      text: '▶ START GAME',
      width: btnW,
      height: btnH,
      fontSize: 15,
      bgColor: 0x15803d,
      hoverColor: 0x22c55e,
      onClick: callbacks.onStart,
    });
    btnStart.x = (panelW - btnW) / 2;
    btnStart.y = startY;
    this.addChild(btnStart);

    const btnSettings = new Button({
      text: '⚙ SETTINGS',
      width: btnW,
      height: btnH,
      fontSize: 15,
      bgColor: 0x1d4ed8,
      hoverColor: 0x3b82f6,
      onClick: callbacks.onSettings,
    });
    btnSettings.x = (panelW - btnW) / 2;
    btnSettings.y = startY + gap;
    this.addChild(btnSettings);

    const btnAbout = new Button({
      text: '✝ MEMORIAL',
      width: btnW,
      height: btnH,
      fontSize: 15,
      bgColor: 0x7c3aed,
      hoverColor: 0x8b5cf6,
      onClick: callbacks.onAbout,
    });
    btnAbout.x = (panelW - btnW) / 2;
    btnAbout.y = startY + gap * 2;
    this.addChild(btnAbout);

    // 5. Best Score Display
    this.highScoreText = new Text({
      text: 'HI-SCORE: 00',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 14,
        fontWeight: 'bold',
        fill: '#4ade80',
        stroke: { color: '#000000', width: 3 },
      }),
    });
    this.highScoreText.anchor.set(0.5, 0);
    this.highScoreText.x = panelW / 2;
    this.highScoreText.y = panelH - 34;
    this.addChild(this.highScoreText);

    this.updateHighScore();
  }

  public updateHighScore() {
    const high = localStorage.getItem(GAME_CONFIG.STORAGE.HIGH_SCORE) || '0';
    this.highScoreText.text = `HI-SCORE: ${high}`;
  }
}
