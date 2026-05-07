import { Howl } from 'howler';

const silentHowl = new Howl({ src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'], volume: 0 });

export const sounds = {
  footstep: silentHowl,
  swing: silentHowl,
  hit: silentHowl,
  levelUp: silentHowl,
  bgm: silentHowl,
};
