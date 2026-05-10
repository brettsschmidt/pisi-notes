"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { pickLine, type MascotLine, type MascotEvent } from "@/lib/mascot/dialog";
import { onSpeak, speak } from "@/lib/mascot/bus";

const SPEECH_DURATION_MS = 5500;
const IDLE_INTERVAL_MS = 90_000;

interface MascotProps {
  greetOnMount?: boolean;
}

export function Mascot({ greetOnMount = false }: MascotProps) {
  const [line, setLine] = useState<MascotLine | null>(null);
  const [bouncing, setBouncing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function show(event: MascotEvent) {
      const next = pickLine(event);
      setLine(next);
      setBouncing(true);
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greetOnMount]);

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
        className={`pointer-events-auto select-none rounded-full p-1 transition-transform ${
          bouncing ? "animate-bounce" : "hover:-translate-y-0.5"
        }`}
        style={{ filter: moodTint }}
      >
        <Image
          src="/mascot/cat-south.png"
          alt=""
          width={64}
          height={64}
          unoptimized
          priority
          className="h-16 w-16 [image-rendering:pixelated]"
          draggable={false}
        />
      </button>
    </div>
  );
}
