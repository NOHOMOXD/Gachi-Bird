import { Application, Assets, Spritesheet, Texture, Container } from 'pixi.js';
import { GAME_CONFIG } from '../config';
import { ScaleManager } from './ScaleManager';
import { AudioManager } from './AudioManager';
import { Background } from '../entities/Background';
import { Bird } from '../entities/Bird';
import { PipeManager } from '../entities/PipeManager';
import { Preloader } from '../ui/Preloader';
import { MainMenu } from '../ui/MainMenu';
import { SettingsMenu } from '../ui/SettingsMenu';
import { AboutModal } from '../ui/AboutModal';
import { HUD } from '../ui/HUD';
import { GameOverModal } from '../ui/GameOverModal';

export enum GameState {
  LOADING,
  MENU,
  SETTINGS,
  ABOUT,
  READY,
  PLAYING,
  GAMEOVER,
}

export class Game {
  private app: Application;
  private scaleManager!: ScaleManager;
  private audioManager!: AudioManager;

  private state: GameState = GameState.LOADING;

  // Scene containers
  private worldContainer!: Container;
  private uiContainer!: Container;

  // Entities
  private background!: Background;
  private bird!: Bird;
  private pipeManager!: PipeManager;

  // UI
  private preloader!: Preloader;
  private mainMenu!: MainMenu;
  private settingsMenu!: SettingsMenu;
  private aboutModal!: AboutModal;
  private hud!: HUD;
  private gameOverModal!: GameOverModal;

  // Gameplay variables
  private score: number = 0;
  private shakeTime: number = 0;
  private shakeMagnitude: number = 0;

  constructor() {
    this.app = new Application();
  }

  public async init() {
    // 1. Initialize Pixi application
    await this.app.init({
      width: GAME_CONFIG.WIDTH,
      height: GAME_CONFIG.HEIGHT,
      backgroundColor: 0x0d0d12,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.appendChild(this.app.canvas);
    }

    // 2. Initialize Scale & Audio managers
    this.scaleManager = new ScaleManager(this.app.canvas);
    this.audioManager = AudioManager.getInstance();

    // 3. Setup Scene Containers
    this.worldContainer = new Container();
    this.uiContainer = new Container();
    this.app.stage.addChild(this.worldContainer);
    this.app.stage.addChild(this.uiContainer);

    // 4. Show Preloader
    this.preloader = new Preloader();
    this.uiContainer.addChild(this.preloader);

    // 5. Load assets & Audio completely
    await this.loadAssets();

    // 6. Setup input listeners
    this.setupInputs();

    // 7. Start main game loop ticker
    this.app.ticker.add((ticker) => {
      const dt = Math.min(0.05, ticker.deltaMS / 1000);
      this.update(dt);
    });
  }

  private async loadAssets() {
    this.preloader.setProgress(0.1, 'LOADING GRAPHICS...');

    // Load spritesheet atlas
    const sheetData = await Assets.load({
      src: './assets/atlas.json',
      onProgress: (ratio: number) => this.preloader.setProgress(0.1 + ratio * 0.35, 'LOADING GRAPHICS...'),
    });

    // Load memorial texture
    this.preloader.setProgress(0.5, 'LOADING MEMORIAL...');
    const memorialTexture = await Assets.load('./assets/memorial.jpg');

    // Load critical audio files (SFX + Titanic menu music)
    this.preloader.setProgress(0.55, 'DECODING AUDIO...');
    await this.audioManager.preloadCritical((audioRatio) => {
      this.preloader.setProgress(0.55 + audioRatio * 0.45, 'DECODING AUDIO...');
    });

    const sheet = sheetData as Spritesheet;
    const rainbowTexture = sheet.textures['rainbow'];

    this.createGameObjects(sheet, memorialTexture, rainbowTexture);

    // Start background preloading of remaining game tracks without blocking UI
    this.audioManager.preloadRemaining();

    // Set callback for entering game: unlocks audio and enters menu with music immediately
    this.preloader.setOnEnter(() => {
      this.audioManager.unlock();
      this.uiContainer.removeChild(this.preloader);
      this.goToMenu();
    });

    // Trigger completion prompt
    this.preloader.setProgress(1, 'READY!');
  }

  private createGameObjects(
    sheet: Spritesheet,
    memorialTexture: Texture,
    rainbowTexture: Texture
  ) {
    // 1. Background
    const billyTextures = sheet.animations['billy'];
    const groundTexture = sheet.textures['ground'];
    this.background = new Background(billyTextures, groundTexture);
    this.worldContainer.addChild(this.background.bgSprite);

    // 2. Lockers (single canonical locker texture + seamless body extension)
    this.pipeManager = new PipeManager(
      sheet.textures['locker'],
      sheet.textures['locker_body'],
      this.background.getGroundY()
    );
    this.pipeManager.onScore = () => this.handleScore();
    this.worldContainer.addChild(this.pipeManager);

    // 3. Ground (rendered in front of lockers so bottom locker extends cleanly into ground)
    this.worldContainer.addChild(this.background.ground);

    // 4. Bird (Billy head 10 frames)
    const headTextures = sheet.animations['head'];
    this.bird = new Bird(headTextures);
    this.worldContainer.addChild(this.bird);

    // 5. UI Screens
    this.hud = new HUD({
      onToggleMute: () => this.audioManager.toggleMute(),
      onToggleFullscreen: () => this.scaleManager.toggleFullscreen(),
      getIsMuted: () => this.audioManager.isMuted,
    });
    this.uiContainer.addChild(this.hud);

    this.mainMenu = new MainMenu(
      {
        onStart: () => this.startReadyMode(),
        onSettings: () => this.goToSettings(),
        onAbout: () => this.goToAbout(),
      },
      rainbowTexture
    );
    this.mainMenu.visible = false;
    this.uiContainer.addChild(this.mainMenu);

    this.settingsMenu = new SettingsMenu(() => this.goToMenu());
    this.settingsMenu.visible = false;
    this.uiContainer.addChild(this.settingsMenu);

    this.aboutModal = new AboutModal(() => this.goToMenu(), memorialTexture);
    this.aboutModal.visible = false;
    this.uiContainer.addChild(this.aboutModal);

    this.gameOverModal = new GameOverModal({
      onRestart: () => this.startReadyMode(),
      onMenu: () => this.goToMenu(),
    });
    this.gameOverModal.visible = false;
    this.uiContainer.addChild(this.gameOverModal);
  }

  private setupInputs() {
    const handleAction = () => {
      this.audioManager.unlock();

      if (this.state === GameState.READY) {
        this.state = GameState.PLAYING;
        this.hud.showHint(false);
        this.audioManager.playRandomGameMusic();
        this.flap();
      } else if (this.state === GameState.PLAYING) {
        this.flap();
      }
    };

    // Keyboard (Space, ArrowUp, W, Enter)
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'KeyW', 'Enter'].includes(e.code)) {
        if (this.state === GameState.LOADING) {
          e.preventDefault();
          this.audioManager.unlock();
          this.uiContainer.removeChild(this.preloader);
          this.goToMenu();
        } else if (this.state === GameState.READY || this.state === GameState.PLAYING) {
          e.preventDefault();
          handleAction();
        }
      }
    });

    // Pointer events on canvas
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerdown', () => {
      if (this.state === GameState.READY || this.state === GameState.PLAYING) {
        handleAction();
      }
    });
  }

  private flap() {
    this.bird.flap();
    this.audioManager.playSfx('spank');
  }

  private handleScore() {
    this.score++;
    this.hud.setScore(this.score);
    this.audioManager.playSfx('woo');
  }

  private startReadyMode() {
    this.score = 0;
    this.hud.setScore(0);
    this.hud.showHint(true);
    this.hud.visible = true;

    this.mainMenu.visible = false;
    this.settingsMenu.visible = false;
    this.aboutModal.visible = false;
    this.gameOverModal.visible = false;

    this.bird.reset();
    this.bird.visible = true;
    this.pipeManager.reset();

    this.state = GameState.READY;
  }

  private goToMenu() {
    this.state = GameState.MENU;

    this.mainMenu.updateHighScore();
    this.mainMenu.visible = true;
    this.settingsMenu.visible = false;
    this.aboutModal.visible = false;
    this.gameOverModal.visible = false;
    this.hud.visible = false;

    this.bird.visible = false;
    this.audioManager.playMenuMusic();
  }

  private goToSettings() {
    this.state = GameState.SETTINGS;
    this.mainMenu.visible = false;
    this.settingsMenu.refresh();
    this.settingsMenu.visible = true;
  }

  private goToAbout() {
    this.state = GameState.ABOUT;
    this.mainMenu.visible = false;
    this.aboutModal.visible = true;
  }

  private handleGameOver() {
    this.state = GameState.GAMEOVER;
    this.bird.die();
    this.audioManager.playSfx('die');
    this.audioManager.stopMusic();

    // Trigger screen shake
    this.shakeTime = 0.4;
    this.shakeMagnitude = 10;

    // Check high score
    const currentHigh = parseInt(
      localStorage.getItem(GAME_CONFIG.STORAGE.HIGH_SCORE) || '0',
      10
    );
    const isNewRecord = this.score > currentHigh;
    if (isNewRecord) {
      localStorage.setItem(GAME_CONFIG.STORAGE.HIGH_SCORE, this.score.toString());
    }

    this.gameOverModal.show(this.score, isNewRecord);
  }

  private update(dt: number) {
    // 1. Camera shake
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const ox = (Math.random() - 0.5) * this.shakeMagnitude * 2;
      const oy = (Math.random() - 0.5) * this.shakeMagnitude * 2;
      this.worldContainer.position.set(ox, oy);
    } else {
      this.worldContainer.position.set(0, 0);
    }

    // 2. State-specific updates
    const isPlaying = this.state === GameState.PLAYING;
    this.background.update(dt, isPlaying);

    if (this.state === GameState.READY) {
      const t = performance.now() / 300;
      this.bird.y = GAME_CONFIG.BIRD_START_Y + Math.sin(t) * 6;
      this.bird.rotation = 0;
    } else if (this.state === GameState.PLAYING) {
      this.bird.update(dt);
      this.pipeManager.update(dt, this.bird.x);

      // Collisions check
      const groundY = this.background.getGroundY();
      const hitbox = this.bird.getHitbox();

      // Check ground collision
      if (hitbox.y + hitbox.height >= groundY) {
        this.handleGameOver();
        return;
      }

      // Check ceiling collision
      if (hitbox.y <= 0) {
        this.bird.y = hitbox.height / 2;
        this.bird.vy = 0;
      }

      // Check lockers collision
      if (this.pipeManager.checkCollision(hitbox)) {
        this.handleGameOver();
      }
    }
  }
}
