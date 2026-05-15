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

// Drag distance (px) past which a pointer-up is treated as a drop, not a tap.
const DRAG_THRESHOLD_PX = 4;
const POSITION_STORAGE_KEY = "pisi-mascot-position";
const FRAME_SIZE_PX = 80; // matches `.pisi-mascot-frame { width/height: 5rem }`

interface MascotPosition {
  /** Distance from the right edge of the viewport, in pixels. */
  right: number;
  /** Distance from the bottom edge of the viewport, in pixels. */
  bottom: number;
}

const DEFAULT_POSITION: MascotPosition = { right: 12, bottom: 80 };

function clampPosition(p: MascotPosition): MascotPosition {
  if (typeof window === "undefined") return p;
  const maxRight = Math.max(0, window.innerWidth - FRAME_SIZE_PX);
  const maxBottom = Math.max(0, window.innerHeight - FRAME_SIZE_PX);
  return {
    right: Math.max(0, Math.min(maxRight, p.right)),
    bottom: Math.max(0, Math.min(maxBottom, p.bottom)),
  };
}

interface MascotProps {
  greetOnMount?: boolean;
}

export function Mascot({ greetOnMount = false }: MascotProps) {
  const [line, setLine] = useState<MascotLine | null>(null);
  const [bouncing, setBouncing] = useState(false);
  const [anim, setAnim] = useState<MascotAnimation>("idle");
  const [frame, setFrame] = useState(0);
  const [framesLoadable, setFramesLoadable] = useState(true);
  const [position, setPosition] = useState<MascotPosition>(DEFAULT_POSITION);
  const [dragging, setDragging] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originRight: number;
    originBottom: number;
    moved: boolean;
  } | null>(null);

  // Restore position + clamp to viewport on mount and on resize.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(POSITION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MascotPosition;
        if (typeof parsed.right === "number" && typeof parsed.bottom === "number") {
          setPosition(clampPosition(parsed));
        }
      }
    } catch {
      /* corrupt entry — ignore */
    }
    function onResize() {
      setPosition((p) => clampPosition(p));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originRight: position.right,
      originBottom: position.bottom,
      moved: false,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    drag.moved = true;
    if (!dragging) setDragging(true);
    setPosition(
      clampPosition({
        right: drag.originRight - dx,
        bottom: drag.originBottom - dy,
      }),
    );
  }

  function onPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragStateRef.current;
    dragStateRef.current = null;
    setDragging(false);
    if (!drag || drag.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (drag.moved) {
      // Persist the drop and skip the click handler.
      try {
        localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
      } catch {
        /* private mode / storage full — non-fatal */
      }
      return;
    }
    // Treat as a tap: trigger an idle speak.
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

  // Disable bounce / hover-lift animations while actively dragging so the
  // sprite tracks the pointer without jitter.
  const movementClass = dragging
    ? "cursor-grabbing"
    : bouncing
      ? "animate-bounce cursor-grab"
      : "hover:-translate-y-0.5 cursor-grab";

  return (
    <div
      className="pointer-events-none fixed z-30 flex flex-col items-end gap-1"
      style={{ right: `${position.right}px`, bottom: `${position.bottom}px` }}
    >
      {line && (
        <div className="pointer-events-auto max-w-[15rem] rounded-2xl rounded-br-sm border border-border bg-popover px-3 py-2 text-sm leading-snug shadow-md text-popover-foreground animate-in fade-in slide-in-from-bottom-1">
          {line.text}
        </div>
      )}
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="Pisi the cat (drag to move, tap to chat)"
        className={`pisi-mascot-frame pointer-events-auto select-none transition-transform ${movementClass}`}
        style={{ touchAction: "none" }}
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
