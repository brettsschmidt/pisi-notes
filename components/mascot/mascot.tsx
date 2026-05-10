"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { pickLine, type MascotLine, type MascotEvent } from "@/lib/mascot/dialog";
import { onSpeak, speak } from "@/lib/mascot/bus";
import {
  ANIMATION_FPS_MS,
  ANIMATION_FRAMES,
  animationForMood,
  frameSrc,
  type MascotAnimation,
} from "@/lib/mascot/animations";

const SPEECH_DURATION_MS = 5500;
const IDLE_INTERVAL_MS = 90_000;
const REACTION_DURATION_MS = 2200;

interface MascotProps {
  greetOnMount?: boolean;
}

export function Mascot({ greetOnMount = false }: MascotProps) {
  const [line, setLine] = useState<MascotLine | null>(null);
  const [bouncing, setBouncing] = useState(false);
  const [anim, setAnim] = useState<MascotAnimation>("idle");
  const [frame, setFrame] = useState(0);
  const [framesLoadable, setFramesLoadable] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function show(event: MascotEvent) {
      const next = pickLine(event);
      setLine(next);
      setBouncing(true);

      // Switch to the mood-appropriate animation, then drift back to idle
      // after a couple seconds (so cheer-jumps feel reactive, not permanent).
      const nextAnim = animationForMood(next.mood);
      setAnim(nextAnim);
      setFrame(0);
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      if (nextAnim !== "idle") {
        reactionTimerRef.current = setTimeout(() => {
          setAnim("idle");
          setFrame(0);
        }, REACTION_DURATION_MS);
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setLine(null);
        setBouncing(false);
      }, SPEECH_DURATION_MS);
    }

    const off = onSpeak(show);
    if (greetOnMount) show("greeting");

    // Idle chatter — quietly nudges the user every minute or so when nothing
    // is happening. Cleared on any explicit speak().
    const idle = setInterval(() => {
      if (!line) show("idle");
    }, IDLE_INTERVAL_MS);

    return () => {
      off();
      clearInterval(idle);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greetOnMount]);

  // Sprite frame loop. We only run the interval if the animation has more
  // than 1 frame and the frames are actually fetchable (otherwise we fall
  // back to the static cat-south.png).
  useEffect(() => {
    if (!framesLoadable) return;
    const total = ANIMATION_FRAMES[anim] ?? 1;
    if (total <= 1) return;
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % total);
    }, ANIMATION_FPS_MS[anim] ?? 160);
    return () => clearInterval(id);
  }, [anim, framesLoadable]);

  function handleClick() {
    speak("idle");
  }

  const moodTint =
    line?.mood === "sad"
      ? "saturate(0.6) brightness(0.95)"
      : line?.mood === "sleepy"
        ? "saturate(0.85) brightness(0.95)"
        : line?.mood === "cheer"
          ? "saturate(1.15) brightness(1.05)"
          : undefined;

  return (
    <div className="pointer-events-none fixed bottom-20 right-3 z-30 flex flex-col items-end gap-1 sm:bottom-24 sm:right-4">
      {line && (
        <div className="pointer-events-auto max-w-[15rem] rounded-2xl rounded-br-sm border border-border bg-popover px-3 py-2 text-sm leading-snug shadow-md text-popover-foreground animate-in fade-in slide-in-from-bottom-1">
          {line.text}
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        aria-label="Pisi the cat says hi"
        className={`pisi-mascot-frame pointer-events-auto select-none transition-transform ${
          bouncing ? "animate-bounce" : "hover:-translate-y-0.5"
        }`}
      >
        {/* Spooky backdrop: full moon + purple haze. Sits behind the cat so
            the silhouette reads in dark mode. */}
        <span aria-hidden className="pisi-mascot-haze" />
        <span aria-hidden className="pisi-mascot-moon" />
        <Image
          src={framesLoadable ? frameSrc(anim, frame) : "/mascot/cat-south.png"}
          alt=""
          width={64}
          height={64}
          unoptimized
          priority
          className="pisi-mascot-cat relative h-16 w-16 [image-rendering:pixelated]"
          draggable={false}
          style={{ filter: moodTint }}
          onError={() => setFramesLoadable(false)}
        />
      </button>
    </div>
  );
}
