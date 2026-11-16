import { Container, Graphics, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';

export interface SliderOptions {
  label: string;
  value: number; // 0.0 to 1.0
  width?: number;
  onChange: (value: number) => void;
}

export class Slider extends Container {
  private track: Graphics;
  private thumb: Graphics;
  private labelText: Text;
  private valueText: Text;

  private sliderWidth: number;
  private value: number;
  private isDragging: boolean = false;
  private onChange: (value: number) => void;

  constructor(options: SliderOptions) {
    super();

    this.sliderWidth = options.width ?? 180;
    this.value = Math.max(0, Math.min(1, options.value));
    this.onChange = options.onChange;

    const style = new TextStyle({
      fontFamily: '"Courier New", Consolas, monospace',
      fontSize: 13,
      fontWeight: 'bold',
      fill: '#ffffff',
      letterSpacing: 1,
    });

    this.labelText = new Text({ text: options.label, style });
    this.labelText.x = 0;
    this.labelText.y = 0;
    this.addChild(this.labelText);

    this.valueText = new Text({
      text: `${Math.round(this.value * 100)}%`,
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 13,
        fontWeight: 'bold',
        fill: '#4ade80',
      }),
    });
    this.valueText.anchor.set(1, 0);
    this.valueText.x = this.sliderWidth;
    this.valueText.y = 0;
    this.addChild(this.valueText);

    this.track = new Graphics();
    this.track.y = 24;
    this.addChild(this.track);

    this.thumb = new Graphics();
    this.thumb.y = 24;
    this.addChild(this.thumb);

    this.redraw();

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerdown', (e: FederatedPointerEvent) => {
      this.isDragging = true;
      this.updateFromPointer(e);
    });

    this.on('globalpointermove', (e: FederatedPointerEvent) => {
      if (this.isDragging) {
        this.updateFromPointer(e);
      }
    });

    this.on('pointerup', () => {
      this.isDragging = false;
    });

    this.on('pointerupoutside', () => {
      this.isDragging = false;
    });
  }

  private updateFromPointer(e: FederatedPointerEvent) {
    const local = this.toLocal(e.global);
    const clampedX = Math.max(0, Math.min(this.sliderWidth, local.x));
    this.value = clampedX / this.sliderWidth;
    this.redraw();
    this.onChange(this.value);
  }

  private redraw() {
    this.track.clear();
    const h = 10;

    // 8-bit black border
    this.track.rect(0, 0, this.sliderWidth, h);
    this.track.fill({ color: 0x000000 });

    // Inner track background
    this.track.rect(2, 2, this.sliderWidth - 4, h - 4);
    this.track.fill({ color: 0x222233 });

    // Active fill
    const fillW = Math.max(0, (this.sliderWidth - 4) * this.value);
    this.track.rect(2, 2, fillW, h - 4);
    this.track.fill({ color: 0x22c55e });

    // 8-bit blocky thumb (square with highlight)
    this.thumb.clear();
    const thumbX = Math.max(0, Math.min(this.sliderWidth - 12, this.sliderWidth * this.value - 6));

    // Outer thumb border
    this.thumb.rect(thumbX, -3, 14, h + 6);
    this.thumb.fill({ color: 0x000000 });

    // Thumb face
    this.thumb.rect(thumbX + 2, -1, 10, h + 2);
    this.thumb.fill({ color: 0xfacc15 });

    // Thumb highlight
    this.thumb.rect(thumbX + 2, -1, 10, 2);
    this.thumb.rect(thumbX + 2, -1, 2, h + 2);
    this.thumb.fill({ color: 0xffffff, alpha: 0.8 });

    this.valueText.text = `${Math.round(this.value * 100)}%`;
  }

  public setValue(val: number) {
    this.value = Math.max(0, Math.min(1, val));
    this.redraw();
  }
}
