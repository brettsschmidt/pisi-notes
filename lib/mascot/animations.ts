// Sprite animation manifest for Pisi the cat. Frame counts match the
// pixellab template defaults — if you regenerate animations with a different
// template, update the counts here and the saved files in /public/mascot/.

import type { MascotMood } from "./dialog";

export type MascotAnimation = "idle" | "jump" | "curled";

export const ANIMATION_FRAMES: Record<MascotAnimation, number> = {
  idle: 8,
  jump: 6,
  curled: 4,
};

// Frame display duration in ms. Cat-typical idle ~150ms feels alive without
// jittering; jumps benefit from slightly tighter cadence.
export const ANIMATION_FPS_MS: Record<MascotAnimation, number> = {
  idle: 160,
  jump: 110,
  curled: 220,
};

// Mood → which animation to play. Idle is the rest state.
export function animationForMood(mood: MascotMood): MascotAnimation {
  if (mood === "cheer") return "jump";
  if (mood === "sleepy" || mood === "sad") return "curled";
  return "idle";
}

export function frameSrc(anim: MascotAnimation, frame: number): string {
  return `/mascot/${anim}/${frame}.png`;
}
