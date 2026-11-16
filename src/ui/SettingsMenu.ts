import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Button } from './Button';
import { Slider } from './Slider';
import { AudioManager } from '../core/AudioManager';
import { GAME_CONFIG, MUSIC_TRACKS } from '../config';

export class SettingsMenu extends Container {
  private musicSlider: Slider;
  private sfxSlider: Slider;
  private trackTitleText: Text;
  private currentTrackIndex: number = 0;

  constructor(onBack: () => void) {
    super();

    const panelW = 270;
    const panelH = 360;

    this.x = (GAME_CONFIG.WIDTH - panelW) / 2;
    this.y = (GAME_CONFIG.HEIGHT - panelH) / 2 - 20;

    // 8-Bit Retro Frame
    const bg = new Graphics();
    bg.rect(4, 0, panelW - 8, panelH);
    bg.rect(0, 4, panelW, panelH - 8);
    bg.fill({ color: 0x000000 });

    bg.rect(4, 4, panelW - 8, panelH - 8);
    bg.fill({ color: 0x2563eb }); // Blue arcade edge

    bg.rect(8, 8, panelW - 16, panelH - 16);
    bg.fill({ color: 0x121220 });

    bg.rect(8, 8, panelW - 16, 2);
    bg.rect(8, 8, 2, panelH - 16);
    bg.fill({ color: 0x93c5fd, alpha: 0.7 });
    this.addChild(bg);

    const title = new Text({
      text: 'SETTINGS',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 24,
        fontWeight: 'bold',
        fill: '#facc15',
        stroke: { color: '#000000', width: 4 },
        letterSpacing: 2,
      }),
    });
    title.anchor.set(0.5, 0);
    title.x = panelW / 2;
    title.y = 16;
    this.addChild(title);

    const audio = AudioManager.getInstance();

    // 1. Music volume slider
    this.musicSlider = new Slider({
      label: 'MUSIC VOLUME',
      value: audio.musicVolume,
      width: 210,
      onChange: (val) => audio.setMusicVolume(val),
    });
    this.musicSlider.x = (panelW - 210) / 2;
    this.musicSlider.y = 58;
    this.addChild(this.musicSlider);

    // 2. SFX volume slider
    this.sfxSlider = new Slider({
      label: 'SFX VOLUME',
      value: audio.sfxVolume,
      width: 210,
      onChange: (val) => audio.setSfxVolume(val),
    });
    this.sfxSlider.x = (panelW - 210) / 2;
    this.sfxSlider.y = 120;
    this.addChild(this.sfxSlider);

    // 3. Music Track Selector (Retro Stepper Select)
    const trackLabel = new Text({
      text: 'BGM TRACK',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 13,
        fontWeight: 'bold',
        fill: '#ffffff',
        letterSpacing: 1,
      }),
    });
    trackLabel.x = (panelW - 210) / 2;
    trackLabel.y = 185;
    this.addChild(trackLabel);

    const selectorW = 210;
    const selectorH = 38;
    const selectorY = 208;
    const btnArrowW = 34;
    const displayBoxW = selectorW - btnArrowW * 2 - 8;

    // Left Arrow
    const btnPrev = new Button({
      text: '◀',
      width: btnArrowW,
      height: selectorH,
      fontSize: 14,
      bgColor: 0x334155,
      hoverColor: 0x475569,
      onClick: () => this.changeTrack(-1),
    });
    btnPrev.x = (panelW - selectorW) / 2;
    btnPrev.y = selectorY;
    this.addChild(btnPrev);

    // Track Display Box
    const displayContainer = new Container();
    displayContainer.x = btnPrev.x + btnArrowW + 4;
    displayContainer.y = selectorY;
    displayContainer.eventMode = 'static';
    displayContainer.cursor = 'pointer';

    const dispBg = new Graphics();
    dispBg.rect(2, 0, displayBoxW - 4, selectorH);
    dispBg.rect(0, 2, displayBoxW, selectorH - 4);
    dispBg.fill({ color: 0x000000 });
    dispBg.rect(2, 2, displayBoxW - 4, selectorH - 4);
    dispBg.fill({ color: 0x0f172a });
    dispBg.rect(2, 2, displayBoxW - 4, 1);
    dispBg.rect(2, 2, 1, selectorH - 4);
    dispBg.fill({ color: 0x38bdf8 });
    displayContainer.addChild(dispBg);

    this.trackTitleText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 12,
        fontWeight: 'bold',
        fill: '#38bdf8',
      }),
    });
    this.trackTitleText.anchor.set(0.5, 0.5);
    this.trackTitleText.x = displayBoxW / 2;
    this.trackTitleText.y = selectorH / 2;
    displayContainer.addChild(this.trackTitleText);

    displayContainer.on('pointerdown', () => this.changeTrack(1));
    this.addChild(displayContainer);

    // Right Arrow
    const btnNext = new Button({
      text: '▶',
      width: btnArrowW,
      height: selectorH,
      fontSize: 14,
      bgColor: 0x334155,
      hoverColor: 0x475569,
      onClick: () => this.changeTrack(1),
    });
    btnNext.x = displayContainer.x + displayBoxW + 4;
    btnNext.y = selectorY;
    this.addChild(btnNext);

    // 4. Back button
    const btnBack = new Button({
      text: '◀ BACK',
      width: 170,
      height: 42,
      fontSize: 15,
      bgColor: 0x334155,
      hoverColor: 0x475569,
      onClick: () => {
        // Return to Titanic menu music when leaving settings
        audio.playMenuMusic();
        onBack();
      },
    });
    btnBack.x = (panelW - 170) / 2;
    btnBack.y = 295;
    this.addChild(btnBack);

    this.initTrackIndex();
  }

  private initTrackIndex() {
    const audio = AudioManager.getInstance();
    const idx = MUSIC_TRACKS.findIndex((t) => t.id === audio.selectedTrack);
    this.currentTrackIndex = idx >= 0 ? idx : 0;
    this.updateTrackDisplay();
  }

  private changeTrack(delta: number) {
    this.currentTrackIndex = (this.currentTrackIndex + delta + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    const track = MUSIC_TRACKS[this.currentTrackIndex];
    AudioManager.getInstance().setSelectedTrack(track.id, true);
    this.updateTrackDisplay();
  }

  private updateTrackDisplay() {
    const track = MUSIC_TRACKS[this.currentTrackIndex];
    this.trackTitleText.text = track.title;
  }

  public refresh() {
    const audio = AudioManager.getInstance();
    this.musicSlider.setValue(audio.musicVolume);
    this.sfxSlider.setValue(audio.sfxVolume);
    this.initTrackIndex();
  }
}
