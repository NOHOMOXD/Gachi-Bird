import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Button } from './Button';
import { GAME_CONFIG } from '../config';

export interface GameOverCallbacks {
  onRestart: () => void;
  onMenu: () => void;
}

export class GameOverModal extends Container {
  private scoreValText: Text;
  private bestValText: Text;
  private newRecordBadge: Text;

  constructor(callbacks: GameOverCallbacks) {
    super();

    const panelW = 270;
    const panelH = 320;

    this.x = (GAME_CONFIG.WIDTH - panelW) / 2;
    this.y = (GAME_CONFIG.HEIGHT - panelH) / 2 - 20;

    // 8-bit retro card
    const bg = new Graphics();
    bg.rect(4, 0, panelW - 8, panelH);
    bg.rect(0, 4, panelW, panelH - 8);
    bg.fill({ color: 0x000000 });

    bg.rect(4, 4, panelW - 8, panelH - 8);
    bg.fill({ color: 0xdc2626 }); // Crimson red border

    bg.rect(8, 8, panelW - 16, panelH - 16);
    bg.fill({ color: 0x121220 });

    bg.rect(8, 8, panelW - 16, 2);
    bg.rect(8, 8, 2, panelH - 16);
    bg.fill({ color: 0xfca5a5, alpha: 0.7 });
    this.addChild(bg);

    // Title
    const title = new Text({
      text: 'GAME OVER',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 30,
        fontWeight: 'bold',
        fill: '#ef4444',
        stroke: { color: '#000000', width: 5 },
        letterSpacing: 2,
      }),
    });
    title.anchor.set(0.5, 0);
    title.x = panelW / 2;
    title.y = 18;
    this.addChild(title);

    // Score box
    const scoreBox = new Graphics();
    scoreBox.rect(20, 65, panelW - 40, 85);
    scoreBox.fill({ color: 0x000000 });

    scoreBox.rect(22, 67, panelW - 44, 81);
    scoreBox.fill({ color: 0x1e293b });

    scoreBox.rect(22, 67, panelW - 44, 2);
    scoreBox.rect(22, 67, 2, 81);
    scoreBox.fill({ color: 0x64748b });
    this.addChild(scoreBox);

    // Score labels
    const scoreLbl = new Text({
      text: 'SCORE:',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 14,
        fontWeight: 'bold',
        fill: '#94a3b8',
      }),
    });
    scoreLbl.x = 35;
    scoreLbl.y = 75;
    this.addChild(scoreLbl);

    this.scoreValText = new Text({
      text: '0',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 22,
        fontWeight: 'bold',
        fill: '#ffffff',
      }),
    });
    this.scoreValText.anchor.set(1, 0);
    this.scoreValText.x = panelW - 35;
    this.scoreValText.y = 73;
    this.addChild(this.scoreValText);

    // Best label
    const bestLbl = new Text({
      text: 'BEST:',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 14,
        fontWeight: 'bold',
        fill: '#94a3b8',
      }),
    });
    bestLbl.x = 35;
    bestLbl.y = 115;
    this.addChild(bestLbl);

    this.bestValText = new Text({
      text: '0',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 22,
        fontWeight: 'bold',
        fill: '#facc15',
      }),
    });
    this.bestValText.anchor.set(1, 0);
    this.bestValText.x = panelW - 35;
    this.bestValText.y = 113;
    this.addChild(this.bestValText);

    // Record badge
    this.newRecordBadge = new Text({
      text: '★ NEW RECORD! ★',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: '#f59e0b',
        stroke: { color: '#000000', width: 2 },
      }),
    });
    this.newRecordBadge.anchor.set(0.5, 0);
    this.newRecordBadge.x = panelW / 2;
    this.newRecordBadge.y = 160;
    this.newRecordBadge.visible = false;
    this.addChild(this.newRecordBadge);

    // Retro buttons
    const btnW = 190;
    const btnRestart = new Button({
      text: '▶ PLAY AGAIN',
      width: btnW,
      height: 44,
      fontSize: 15,
      bgColor: 0x15803d,
      hoverColor: 0x22c55e,
      onClick: callbacks.onRestart,
    });
    btnRestart.x = (panelW - btnW) / 2;
    btnRestart.y = 190;
    this.addChild(btnRestart);

    const btnMenu = new Button({
      text: '■ MAIN MENU',
      width: btnW,
      height: 40,
      fontSize: 14,
      bgColor: 0x334155,
      hoverColor: 0x475569,
      onClick: callbacks.onMenu,
    });
    btnMenu.x = (panelW - btnW) / 2;
    btnMenu.y = 246;
    this.addChild(btnMenu);
  }

  public show(score: number, isNewRecord: boolean) {
    const highScore = localStorage.getItem(GAME_CONFIG.STORAGE.HIGH_SCORE) || '0';
    this.scoreValText.text = score.toString();
    this.bestValText.text = highScore;
    this.newRecordBadge.visible = isNewRecord;
    this.visible = true;
  }
}
