import { Container, Graphics, Text, TextStyle, Sprite, Texture } from 'pixi.js';
import { Button } from './Button';
import { GAME_CONFIG } from '../config';

export class AboutModal extends Container {
  constructor(onBack: () => void, memorialTexture?: Texture) {
    super();

    const panelW = 280;
    const panelH = 350;

    this.x = (GAME_CONFIG.WIDTH - panelW) / 2;
    this.y = (GAME_CONFIG.HEIGHT - panelH) / 2 - 20;

    // 8-bit retro frame
    const bg = new Graphics();
    bg.rect(4, 0, panelW - 8, panelH);
    bg.rect(0, 4, panelW, panelH - 8);
    bg.fill({ color: 0x000000 });

    bg.rect(4, 4, panelW - 8, panelH - 8);
    bg.fill({ color: 0x7c3aed }); // Purple arcade edge

    bg.rect(8, 8, panelW - 16, panelH - 16);
    bg.fill({ color: 0x121220 });

    bg.rect(8, 8, panelW - 16, 2);
    bg.rect(8, 8, 2, panelH - 16);
    bg.fill({ color: 0xc4b5fd, alpha: 0.7 });
    this.addChild(bg);

    const title = new Text({
      text: 'WRESTLE IN PEACE',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 20,
        fontWeight: 'bold',
        fill: '#fde047',
        stroke: { color: '#000000', width: 4 },
        letterSpacing: 1,
      }),
    });
    title.anchor.set(0.5, 0);
    title.x = panelW / 2;
    title.y = 16;
    this.addChild(title);

    if (memorialTexture) {
      const pic = new Sprite(memorialTexture);
      const picW = panelW - 36;
      const picH = (picW / memorialTexture.width) * memorialTexture.height;
      pic.width = picW;
      pic.height = picH;
      pic.x = 18;
      pic.y = 48;
      this.addChild(pic);
    }

    const desc = new Text({
      text: 'William Herrington\n1969 - 2018\nSleep sweet, Aniki ❤',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: '#cbd5e1',
        stroke: { color: '#000000', width: 3 },
        align: 'center',
        lineHeight: 18,
      }),
    });
    desc.anchor.set(0.5, 0);
    desc.x = panelW / 2;
    desc.y = 210;
    this.addChild(desc);

    const btnBack = new Button({
      text: '◀ BACK',
      width: 170,
      height: 42,
      fontSize: 15,
      bgColor: 0x334155,
      hoverColor: 0x475569,
      onClick: onBack,
    });
    btnBack.x = (panelW - 170) / 2;
    btnBack.y = 285;
    this.addChild(btnBack);
  }
}
