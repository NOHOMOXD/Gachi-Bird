import { GAME_CONFIG, MusicTrackId } from '../config';

export class AudioManager {
  private static instance: AudioManager;

  private musicTracks: HTMLAudioElement[] = [];
  private currentMusic: HTMLAudioElement | null = null;

  private sfxBuffers: Map<string, HTMLAudioElement> = new Map();

  public musicVolume: number = 0.4;
  public sfxVolume: number = 0.6;
  public isMuted: boolean = false;
  public unlocked: boolean = false;
  public selectedTrack: MusicTrackId = 'random';

  private constructor() {
    this.loadSettings();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private loadSettings() {
    const savedMusic = localStorage.getItem(GAME_CONFIG.STORAGE.MUSIC_VOL);
    if (savedMusic !== null) {
      const parsed = parseFloat(savedMusic);
      if (!isNaN(parsed)) {
        this.musicVolume = Math.max(0, Math.min(1, parsed));
      }
    }
    const savedSfx = localStorage.getItem(GAME_CONFIG.STORAGE.SFX_VOL);
    if (savedSfx !== null) {
      const parsed = parseFloat(savedSfx);
      if (!isNaN(parsed)) {
        this.sfxVolume = Math.max(0, Math.min(1, parsed));
      }
    }
    const savedTrack = localStorage.getItem(GAME_CONFIG.STORAGE.MUSIC_TRACK) as MusicTrackId | null;
    if (savedTrack && ['random', 'titanic', 'caramell', 'polka'].includes(savedTrack)) {
      this.selectedTrack = savedTrack;
    }
  }

  /**
   * Preloads all music and SFX with full buffering so zero streaming hitch occurs in gameplay.
   */
  public async preloadAll(onProgress: (ratio: number) => void): Promise<void> {
    const musicSources: [string, string][] = [
      ['titanic', GAME_CONFIG.AUDIO.TITANIC],
      ['caramell', GAME_CONFIG.AUDIO.CARAMELL],
      ['polka', GAME_CONFIG.AUDIO.POLKA],
    ];

    const sfxSources: [string, string][] = [
      ['spank', GAME_CONFIG.AUDIO.SPANK],
      ['woo', GAME_CONFIG.AUDIO.WOO],
      ['die', GAME_CONFIG.AUDIO.DIE],
    ];

    const totalFiles = musicSources.length + sfxSources.length;
    let loadedFiles = 0;

    const loadAudioElement = (src: string, isLoop: boolean): Promise<HTMLAudioElement> => {
      return new Promise((resolve) => {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.loop = isLoop;
        audio.src = src;

        let resolved = false;
        const markDone = () => {
          if (!resolved) {
            resolved = true;
            loadedFiles++;
            onProgress(loadedFiles / totalFiles);
            resolve(audio);
          }
        };

        audio.addEventListener('canplaythrough', markDone, { once: true });
        audio.addEventListener('loadeddata', markDone, { once: true });
        audio.addEventListener('error', () => {
          markDone();
        }, { once: true });

        audio.load();
        setTimeout(markDone, 2500);
      });
    };

    // Load music tracks
    this.musicTracks = [];
    for (const [, src] of musicSources) {
      const audio = await loadAudioElement(src, true);
      audio.volume = this.effectiveMusicVolume();
      this.musicTracks.push(audio);
    }

    // Load SFX
    this.sfxBuffers.clear();
    for (const [name, src] of sfxSources) {
      const audio = await loadAudioElement(src, false);
      audio.volume = this.effectiveSfxVolume();
      this.sfxBuffers.set(name, audio);
    }

    onProgress(1);
  }

  public unlock() {
    if (this.unlocked) return;
    this.unlocked = true;

    const dummy = this.sfxBuffers.get('spank');
    if (dummy) {
      dummy.volume = 0;
      dummy.play().then(() => {
        dummy.pause();
        dummy.currentTime = 0;
        dummy.volume = this.effectiveSfxVolume();
      }).catch(() => {});
    }

    if (this.currentMusic && !this.isMuted) {
      this.currentMusic.play().catch(() => {});
    }
  }

  private resolveTrackIndex(trackId: MusicTrackId): number {
    if (trackId === 'random') {
      return Math.floor(Math.random() * this.musicTracks.length);
    }
    const map: Record<Exclude<MusicTrackId, 'random'>, number> = {
      titanic: 0,
      caramell: 1,
      polka: 2,
    };
    return map[trackId] ?? 0;
  }

  private playTrackByIndex(index: number) {
    this.stopMusic();
    if (this.musicTracks.length === 0) return;

    this.currentMusic = this.musicTracks[index];
    if (this.currentMusic) {
      this.currentMusic.currentTime = 0;
      this.currentMusic.volume = this.effectiveMusicVolume();
      if (this.unlocked && !this.isMuted) {
        this.currentMusic.play().catch(() => {});
      }
    }
  }

  public playMenuMusic() {
    this.playTrackByIndex(0); // Titanic is classic menu music
  }

  public setSelectedTrack(trackId: MusicTrackId, preview: boolean = false) {
    this.selectedTrack = trackId;
    localStorage.setItem(GAME_CONFIG.STORAGE.MUSIC_TRACK, trackId);

    if (preview) {
      this.previewTrack(trackId);
    }
  }

  public previewTrack(trackId: MusicTrackId) {
    this.playTrackByIndex(this.resolveTrackIndex(trackId));
  }

  public playRandomGameMusic() {
    this.playTrackByIndex(this.resolveTrackIndex(this.selectedTrack));
  }

  public stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic = null;
    }
  }

  public playSfx(name: 'spank' | 'woo' | 'die') {
    if (this.isMuted) return;
    const template = this.sfxBuffers.get(name);
    if (!template) return;

    const sound = template.cloneNode() as HTMLAudioElement;
    sound.volume = this.effectiveSfxVolume();
    sound.play().catch(() => {});
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem(GAME_CONFIG.STORAGE.MUSIC_VOL, this.musicVolume.toString());
    if (this.currentMusic) {
      this.currentMusic.volume = this.effectiveMusicVolume();
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem(GAME_CONFIG.STORAGE.SFX_VOL, this.sfxVolume.toString());
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.currentMusic) {
      this.currentMusic.volume = this.effectiveMusicVolume();
      if (this.isMuted) {
        this.currentMusic.pause();
      } else if (this.unlocked) {
        this.currentMusic.play().catch(() => {});
      }
    }
    return this.isMuted;
  }

  private effectiveMusicVolume(): number {
    return this.isMuted ? 0 : this.musicVolume;
  }

  private effectiveSfxVolume(): number {
    return this.isMuted ? 0 : this.sfxVolume;
  }
}
