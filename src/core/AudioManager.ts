import { GAME_CONFIG, MusicTrackId } from '../config';

type WebkitWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

export class AudioManager {
  private static instance: AudioManager;

  private ctx: AudioContext;
  private masterGain: GainNode;
  private musicGain: GainNode;
  private sfxGain: GainNode;

  private musicBuffers: Map<number, AudioBuffer> = new Map();
  private sfxBuffers: Map<string, AudioBuffer> = new Map();

  private currentMusicSource: AudioBufferSourceNode | null = null;
  private currentMusicIndex: number = 0;
  private isRemainingLoading: boolean = false;

  public musicVolume: number = 0.4;
  public sfxVolume: number = 0.6;
  public isMuted: boolean = false;
  public unlocked: boolean = false;
  public selectedTrack: MusicTrackId = 'random';

  private constructor() {
    const AudioContextClass =
      window.AudioContext || (window as WebkitWindow).webkitAudioContext || AudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.connect(this.masterGain);

    this.loadSettings();
    this.applyVolumes();
    this.setupNativeUnlock();
  }

  private setupNativeUnlock() {
    const unlockHandler = () => {
      this.unlock();
      if (this.ctx.state === 'running') {
        ['touchstart', 'touchend', 'click', 'pointerdown', 'keydown'].forEach((evt) => {
          window.removeEventListener(evt, unlockHandler, true);
        });
      }
    };

    ['touchstart', 'touchend', 'click', 'pointerdown', 'keydown'].forEach((evt) => {
      window.addEventListener(evt, unlockHandler, { capture: true, passive: true });
    });
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

  private applyVolumes() {
    const t = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, t);
    this.musicGain.gain.setValueAtTime(this.musicVolume, t);
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, t);
  }

  /**
   * Fetches an audio file as binary and decodes it directly into PCM memory (AudioBuffer).
   */
  private async loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuf = await res.arrayBuffer();
      return await this.ctx.decodeAudioData(arrayBuf);
    } catch (err) {
      console.warn(`Failed to load audio: ${url}`, err);
      return null;
    }
  }

  /**
   * Preloads critical audio for fast game startup:
   * - All SFX (35 KB total: spank, woo, die)
   * - Menu theme (Titanic, 3.3 MB)
   */
  public async preloadCritical(onProgress: (ratio: number) => void): Promise<void> {
    const sfxItems: [string, string][] = [
      ['spank', GAME_CONFIG.AUDIO.SPANK],
      ['woo', GAME_CONFIG.AUDIO.WOO],
      ['die', GAME_CONFIG.AUDIO.DIE],
    ];

    const totalCritical = sfxItems.length + 1; // +1 for Titanic
    let loaded = 0;

    // 1. Load SFX in parallel
    for (const [name, url] of sfxItems) {
      const buf = await this.loadAudioBuffer(url);
      if (buf) {
        this.sfxBuffers.set(name, buf);
      }
      loaded++;
      onProgress(loaded / totalCritical);
    }

    // 2. Load Titanic menu track
    const titanicBuf = await this.loadAudioBuffer(GAME_CONFIG.AUDIO.TITANIC);
    if (titanicBuf) {
      this.musicBuffers.set(0, titanicBuf);
    }
    loaded++;
    onProgress(1);
  }

  /**
   * Asynchronously preloads remaining music tracks (Caramell, Polka) in the background
   * without blocking UI, rendering, or gameplay.
   */
  public async preloadRemaining(): Promise<void> {
    if (this.isRemainingLoading) return;
    this.isRemainingLoading = true;

    const remainingTracks: [number, string][] = [
      [1, GAME_CONFIG.AUDIO.CARAMELL],
      [2, GAME_CONFIG.AUDIO.POLKA],
    ];

    for (const [index, url] of remainingTracks) {
      if (!this.musicBuffers.has(index)) {
        const buf = await this.loadAudioBuffer(url);
        if (buf) {
          this.musicBuffers.set(index, buf);
          // If the player selected this track while it was downloading, start playing it
          if (this.currentMusicIndex === index && this.unlocked && !this.isMuted && !this.currentMusicSource) {
            this.playTrackByIndex(index);
          }
        }
      }
    }
  }

  /**
   * Backward-compatible preload method.
   */
  public async preloadAll(onProgress: (ratio: number) => void): Promise<void> {
    await this.preloadCritical(onProgress);
    this.preloadRemaining();
  }

  /**
   * Resumes AudioContext on initial user gesture and kicks iOS CoreAudio pipeline.
   */
  public unlock() {
    // 1. Set audio session to playback if available (bypasses silent switch on iOS 16.4+)
    if ('audioSession' in navigator) {
      try {
        (navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback';
      } catch {}
    }

    // 2. Resume Web Audio context
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // 3. Force hardware connection via a 1-sample silent buffer
    try {
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
    } catch {}

    this.unlocked = true;

    if (!this.currentMusicSource && this.musicBuffers.has(this.currentMusicIndex) && !this.isMuted) {
      this.playTrackByIndex(this.currentMusicIndex);
    }
  }

  private resolveTrackIndex(trackId: MusicTrackId): number {
    if (trackId === 'random') {
      // Pick random from all 3 tracks
      return Math.floor(Math.random() * 3);
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
    this.currentMusicIndex = index;

    const buffer = this.musicBuffers.get(index);
    if (!buffer) {
      // Track is still downloading in background; will auto-play once decoded
      return;
    }

    if (this.ctx.state === 'suspended' && this.unlocked) {
      this.ctx.resume().catch(() => {});
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.musicGain);
    source.start(0);
    this.currentMusicSource = source;
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
    if (this.currentMusicSource) {
      try {
        this.currentMusicSource.stop(0);
        this.currentMusicSource.disconnect();
      } catch {}
      this.currentMusicSource = null;
    }
  }

  /**
   * Plays a pre-decoded sound effect via native Web Audio API.
   * Completely zero DOM allocations and sub-millisecond latency.
   */
  public playSfx(name: 'spank' | 'woo' | 'die') {
    if (this.isMuted) return;
    const buffer = this.sfxBuffers.get(name);
    if (!buffer) return;

    if (this.ctx.state === 'suspended' && this.unlocked) {
      this.ctx.resume().catch(() => {});
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.sfxGain);
    source.start(0);
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem(GAME_CONFIG.STORAGE.MUSIC_VOL, this.musicVolume.toString());
    this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem(GAME_CONFIG.STORAGE.SFX_VOL, this.sfxVolume.toString());
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    return this.isMuted;
  }
}
