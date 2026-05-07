import { Howl } from 'howler';

// In a real game, you would provide valid URLs for these sound files.
// For this demo, we'll use placeholder sound instances that don't load anything 
// to prevent console errors from missing files, but demonstrate the structure.
// You can replace these src URLs with actual sound files when ready (e.g., .mp3 or .wav)

const createPlaceholderSound = () => new Howl({ src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'], volume: 0 });

export const sounds = {
  footstep: new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/2281/2281-preview.mp3'], // Example step
    volume: 0.1,
    rate: 1.5,
  }),
  swing: new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/2048/2048-preview.mp3'], // Whoosh
    volume: 0.2,
  }),
  hit: new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/2144/2144-preview.mp3'], // Hit punch
    volume: 0.3,
  }),
  levelUp: new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/1997/1997-preview.mp3'], // Level up
    volume: 0.4,
  }),
  bgm: new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/1076/1076-preview.mp3'], // Some ambient wind/drone
    volume: 0.05,
    loop: true,
  })
};
