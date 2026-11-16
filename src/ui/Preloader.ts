import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GAME_CONFIG } from '../config';

export class Preloader extends Container {
  private bar: Graphics;
  private statusText: Text;
  private percentText: Text;
  private enterButton: Container;
  private enterPromptText: Text;
  private readonly panelW: number = 270;
  private readonly panelH: number = 270;
  private widthPx: number = 210;
  private onEnterCallback?: () => void;
  private isComplete: boolean = false;

  constructor() {
    super();

    const panelW = this.panelW;
    const panelH = this.panelH;

    this.x = (GAME_CONFIG.WIDTH - panelW) / 2;
    this.y = (GAME_CONFIG.HEIGHT - panelH) / 2 - 20;

    // 1. 8-Bit Retro Card Frame (matching MainMenu)
    const bg = new Graphics();
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

    // 2. Title
    const title = new Text({
      text: 'GACHI BIRD',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 26,
        fontWeight: 'bold',
        fill: '#facc15',
        stroke: { color: '#000000', width: 4 },
        letterSpacing: 2,
      }),
    });
    title.anchor.set(0.5, 0);
    title.x = panelW / 2;
    title.y = 24;
    this.addChild(title);

    // 3. Status message
    this.statusText = new Text({
      text: 'LOADING GRAPHICS...',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: '#94a3b8',
        letterSpacing: 1,
      }),
    });
    this.statusText.anchor.set(0.5, 0);
    this.statusText.x = panelW / 2;
    this.statusText.y = 66;
    this.addChild(this.statusText);

    // 4. Progress bar frame
    const barFrame = new Graphics();
    const frameX = (panelW - this.widthPx) / 2;
    const frameY = 96;

    barFrame.rect(frameX - 4, frameY - 4, this.widthPx + 8, 20);
    barFrame.fill({ color: 0x000000 });
    barFrame.rect(frameX - 2, frameY - 2, this.widthPx + 4, 16);
    barFrame.fill({ color: 0x334155 });
    barFrame.rect(frameX, frameY, this.widthPx, 12);
    barFrame.fill({ color: 0x0f172a });
    this.addChild(barFrame);

    this.bar = new Graphics();
    this.addChild(this.bar);

    // 5. Percent text
    this.percentText = new Text({
      text: '0%',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 14,
        fontWeight: 'bold',
        fill: '#4ade80',
      }),
    });
    this.percentText.anchor.set(0.5, 0);
    this.percentText.x = panelW / 2;
    this.percentText.y = 124;
    this.addChild(this.percentText);

    // 6. "CLICK TO ENTER" button container inside card
    this.enterButton = new Container();
    this.enterButton.visible = false;
    this.enterButton.eventMode = 'static';
    this.enterButton.cursor = 'pointer';

    const enterBtnW = 210;
    const enterBtnH = 46;
    const btnBg = new Graphics();
    btnBg.rect(2, 0, enterBtnW - 4, enterBtnH);
    btnBg.rect(0, 2, enterBtnW, enterBtnH - 4);
    btnBg.fill({ color: 0x000000 });

    btnBg.rect(2, 2, enterBtnW - 4, enterBtnH - 4);
    btnBg.fill({ color: 0x16a34a });

    btnBg.rect(2, 2, enterBtnW - 4, 3);
    btnBg.rect(2, 2, 3, enterBtnH - 4);
    btnBg.fill({ color: 0x4ade80 });

    btnBg.rect(2, enterBtnH - 5, enterBtnW - 4, 3);
    btnBg.rect(enterBtnW - 5, 2, 3, enterBtnH - 4);
    btnBg.fill({ color: 0x14532d });
    this.enterButton.addChild(btnBg);

    this.enterPromptText = new Text({
      text: '▶ CLICK TO ENTER',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 14,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: { color: '#000000', width: 3 },
        letterSpacing: 1,
      }),
    });
    this.enterPromptText.anchor.set(0.5, 0.5);
    this.enterPromptText.x = enterBtnW / 2;
    this.enterPromptText.y = enterBtnH / 2;
    this.enterButton.addChild(this.enterPromptText);

    this.enterButton.x = (panelW - enterBtnW) / 2;
    this.enterButton.y = 180;

    const triggerEnter = () => {
      if (this.isComplete && this.onEnterCallback) {
        this.onEnterCallback();
      }
    };

    this.enterButton.on('pointerdown', triggerEnter);
    this.addChild(this.enterButton);

    this.eventMode = 'static';
    this.on('pointerdown', triggerEnter);

    this.setProgress(0, 'INITIALIZING...');
  }

  public setProgress(ratio: number, status?: string) {
    const clamped = Math.max(0, Math.min(1, ratio));
    if (status) {
      this.statusText.text = status;
    }

    this.bar.clear();
    const frameX = (this.panelW - this.widthPx) / 2;
    const frameY = 96;
    const fillW = Math.max(0, this.widthPx * clamped);

    this.bar.rect(frameX, frameY, fillW, 12);
    this.bar.fill({ color: 0x22c55e });

    this.percentText.text = `${Math.round(clamped * 100)}%`;

    if (clamped >= 1) {
      this.isComplete = true;
      this.statusText.text = 'READY!';
      this.enterButton.visible = true;
      this.cursor = 'pointer';
    }
  }

  public setOnEnter(callback: () => void) {
    this.onEnterCallback = callback;
  }
}
