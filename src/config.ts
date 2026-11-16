export const MUSIC_TRACKS = [
  { id: 'random', title: '00: RANDOM' },
  { id: 'titanic', title: '01: TITANIC' },
  { id: 'caramell', title: '02: CARAMELL' },
  { id: 'polka', title: '03: POLKA' },
] as const;

export type MusicTrackId = typeof MUSIC_TRACKS[number]['id'];

export const GAME_CONFIG = {
  // Logical Canvas dimensions (9:16 portrait)
  WIDTH: 360,
  HEIGHT: 640,

  // Physics (frame-rate independent, units per second)
  GRAVITY: 950,
  JUMP_FORCE: 330,
  MAX_FALL_SPEED: 550,

  // Flappy Bird Rotation
  ROTATION_UP: -0.45,       // ~ -26 degrees
  ROTATION_DOWN: 1.35,      // ~ +77 degrees dive
  ROTATION_SMOOTH_UP: 18,   // fast pitch up
  ROTATION_SMOOTH_DOWN: 4.5,// smooth downward dive

  // Lockers (Pipes) & Balance
  LOCKER_SPEED: 135,
  LOCKER_SPACING: 200,        // distance between lockers
  LOCKER_GAP: 140,            // vertical gap between top and bottom locker
  LOCKER_MAX_DELTA_Y: 80,     // maximum vertical step between consecutive gaps
  LOCKER_MIN_TOP: 65,         // safe margin from top of screen
  LOCKER_MIN_BOTTOM: 75,      // safe margin above the ground
  FIRST_LOCKER_DELAY_X: 300,  // distance before the first locker appears
  LOCKER_WIDTH: 52,
  LOCKER_HEIGHT: 242,

  // Ground
  GROUND_HEIGHT: 120,

  // Player Starting Position & Hitbox
  BIRD_X: 70,
  BIRD_START_Y: 240,
  HITBOX_INSET_X: 6,
  HITBOX_INSET_Y: 6,

  // Animation frame rates
  BILLY_BG_FPS: 7.5,        // 7.5 FPS with 24 frames = 3.2s smooth, non-nauseating loop
  BILLY_HEAD_FPS: 50,       // 50 FPS = 20ms per frame (the iconic fast head shake)

  // Audio paths
  AUDIO: {
    TITANIC: 'audio/titanic.mp3',
    CARAMELL: 'audio/caramellvansen.mp3',
    POLKA: 'audio/polka.mp3',
    SPANK: 'audio/spank.mp3',
    WOO: 'audio/woo.mp3',
    DIE: 'audio/die.mp3',
  },

  // Storage keys
  STORAGE: {
    HIGH_SCORE: 'gachi_bird_high_score',
    MUSIC_VOL: 'gachi_bird_music_vol',
    SFX_VOL: 'gachi_bird_sfx_vol',
    MUSIC_TRACK: 'gachi_bird_selected_track',
  },
};
