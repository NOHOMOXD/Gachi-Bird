import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export interface ButtonOptions {
  text: string;
  width?: number;
  height?: number;
  bgColor?: number;
  hoverColor?: number;
  textColor?: string;
  fontSize?: number;
  onClick: () => void;
}

export class Button extends Container {
  private bg: Graphics;
  private btnText: Text;
  private opts: Required<ButtonOptions>;
  private isPressed: boolean = false;

  constructor(options: ButtonOptions) {
    super();

    this.opts = {
      text: options.text,
      width: options.width ?? 180,
      height: options.height ?? 44,
      bgColor: options.bgColor ?? 0x16a34a,
      hoverColor: options.hoverColor ?? 0x22c55e,
      textColor: options.textColor ?? '#ffffff',
      fontSize: options.fontSize ?? 15,
      onClick: options.onClick,
    };

    this.bg = new Graphics();
    this.addChild(this.bg);

    const style = new TextStyle({
      fontFamily: '"Courier New", Consolas, monospace',
      fontSize: this.opts.fontSize,
      fontWeight: 'bold',
      fill: this.opts.textColor,
      stroke: { color: '#000000', width: 3 },
      dropShadow: {
        alpha: 0.6,
        blur: 0,
        distance: 2,
      },
      letterSpacing: 1,
    });

    this.btnText = new Text({ text: this.opts.text, style });
    this.btnText.anchor.set(0.5, 0.5);
    this.btnText.x = this.opts.width / 2;
    this.btnText.y = this.opts.height / 2;
    this.addChild(this.btnText);

    this.drawRetroButton(this.opts.bgColor, false);

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerover', () => {
      if (!this.isPressed) this.drawRetroButton(this.opts.hoverColor, false);
    });

    this.on('pointerout', () => {
      this.isPressed = false;
      this.btnText.y = this.opts.height / 2;
      this.drawRetroButton(this.opts.bgColor, false);
    });

    this.on('pointerdown', () => {
      this.isPressed = true;
      this.btnText.y = this.opts.height / 2 + 2;
      this.drawRetroButton(this.opts.bgColor, true);
    });

    this.on('pointerup', () => {
      if (this.isPressed) {
        this.isPressed = false;
        this.btnText.y = this.opts.height / 2;
        this.drawRetroButton(this.opts.hoverColor, false);
        this.opts.onClick();
      }
    });

    this.on('pointerupoutside', () => {
      this.isPressed = false;
      this.btnText.y = this.opts.height / 2;
      this.drawRetroButton(this.opts.bgColor, false);
    });
  }

  private drawRetroButton(bodyColor: number, pressed: boolean) {
    this.bg.clear();
    const w = this.opts.width;
    const h = this.opts.height;

    // 1. Black outer stepped border (8-bit arcade cut corners)
    this.bg.rect(2, 0, w - 4, h);
    this.bg.rect(0, 2, w, h - 4);
    this.bg.fill({ color: 0x000000 });

    // 2. Beveled highlight / shadow edges
    const highlight = pressed ? 0x0a0a0a : 0xffffff;
    const shadow = pressed ? 0xffffff : 0x000000;

    // Top edge highlight
    this.bg.rect(2, 2, w - 4, 3);
    this.bg.fill({ color: highlight, alpha: pressed ? 0.4 : 0.6 });

    // Left edge highlight
    this.bg.rect(2, 2, 3, h - 4);
    this.bg.fill({ color: highlight, alpha: pressed ? 0.4 : 0.6 });

    // Bottom edge shadow
    this.bg.rect(2, h - 5, w - 4, 3);
    this.bg.fill({ color: shadow, alpha: pressed ? 0.6 : 0.5 });

    // Right edge shadow
    this.bg.rect(w - 5, 2, 3, h - 4);
    this.bg.fill({ color: shadow, alpha: pressed ? 0.6 : 0.5 });

    // 3. Button face
    this.bg.rect(5, 5, w - 10, h - 10);
    this.bg.fill({ color: bodyColor });
  }

  public setText(txt: string) {
    this.btnText.text = txt;
  }
}
