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

// Throwing thresholds: anything faster than this on release becomes a bounce;
// the cap stops her from going so fast she teleports between frames.
const THROW_VELOCITY_PX_PER_MS = 0.18;
const MAX_VELOCITY_PX_PER_MS = 2.4;
const VELOCITY_SAMPLE_WINDOW_MS = 90;

interface MascotPosition {
  /** Top-left x in viewport px. */
  x: number;
  /** Top-left y in viewport px. */
  y: number;
}

function viewportSize() {
  if (typeof window === "undefined") return { w: 1024, h: 768 };
  return { w: window.innerWidth, h: window.innerHeight };
}

function defaultPosition(): MascotPosition {
  const { w, h } = viewportSize();
  return { x: w - FRAME_SIZE_PX - 12, y: h - FRAME_SIZE_PX - 80 };
}

function clampPosition(p: MascotPosition): MascotPosition {
  const { w, h } = viewportSize();
  return {
    x: Math.max(0, Math.min(w - FRAME_SIZE_PX, p.x)),
    y: Math.max(0, Math.min(h - FRAME_SIZE_PX, p.y)),
  };
}

interface MascotProps {
  greetOnMount?: boolean;
}

export function Mascot({ greetOnMount = false }: MascotProps) {
  // Don't render Pisi until we're on the client — position depends on viewport
  // dimensions, which differ from the SSR fallback and would otherwise cause
  // a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [line, setLine] = useState<MascotLine | null>(null);
  const [bouncing, setBouncing] = useState(false);
  const [anim, setAnim] = useState<MascotAnimation>("idle");
  const [frame, setFrame] = useState(0);
  const [framesLoadable, setFramesLoadable] = useState(true);
  const [position, setPosition] = useState<MascotPosition>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [bouncingPhysics, setBouncingPhysics] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originPos: MascotPosition;
    moved: boolean;
    samples: { x: number; y: number; t: number }[];
  } | null>(null);

  // Latest position kept outside React state so the rAF loop can mutate
  // without triggering re-renders on every frame.
  const positionRef = useRef<MascotPosition>(position);
  const velocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Keep positionRef in sync with React state on the slow path (mount + drag).
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Restore position + clamp on mount and on resize.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(POSITION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MascotPosition;
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition(clampPosition(parsed));
        } else {
          setPosition(clampPosition(defaultPosition()));
        }
      } else {
        setPosition(clampPosition(defaultPosition()));
      }
    } catch {
      setPosition(clampPosition(defaultPosition()));
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

  useEffect(() => {
    if (!framesLoadable) return;
    const total = ANIMATION_FRAMES[anim] ?? 1;
    if (total <= 1) return;
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % total);
    }, ANIMATION_FPS_MS[anim] ?? 160);
    return () => clearInterval(id);
  }, [anim, framesLoadable]);

  // DVD-screensaver style bounce loop. Speed is preserved on each reflection
  // (no friction) so she keeps going until the user grabs her again.
  function startBounceLoop() {
    if (rafRef.current !== null) return;
    setBouncingPhysics(true);
    lastFrameTimeRef.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - lastFrameTimeRef.current); // cap for tab-switch jitter
      lastFrameTimeRef.current = now;
      const { w, h } = viewportSize();
      const maxX = Math.max(0, w - FRAME_SIZE_PX);
      const maxY = Math.max(0, h - FRAME_SIZE_PX);
      let { x, y } = positionRef.current;
      let { vx, vy } = velocityRef.current;
      x += vx * dt;
      y += vy * dt;
      if (x <= 0) {
        x = 0;
        vx = Math.abs(vx);
      } else if (x >= maxX) {
        x = maxX;
        vx = -Math.abs(vx);
      }
      if (y <= 0) {
        y = 0;
        vy = Math.abs(vy);
      } else if (y >= maxY) {
        y = maxY;
        vy = -Math.abs(vy);
      }
      positionRef.current = { x, y };
      velocityRef.current = { vx, vy };
      setPosition({ x, y });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function stopBounceLoop() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    velocityRef.current = { vx: 0, vy: 0 };
    setBouncingPhysics(false);
  }

  // Always tear the loop down on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    // Grabbing her stops any in-flight bounce.
    stopBounceLoop();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originPos: positionRef.current,
      moved: false,
      samples: [{ x: e.clientX, y: e.clientY, t: performance.now() }],
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
    drag.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    // Keep only the most recent samples so the velocity reflects the user's
    // last gesture rather than the whole drag.
    while (drag.samples.length > 6) drag.samples.shift();
    setPosition(clampPosition({ x: drag.originPos.x + dx, y: drag.originPos.y + dy }));
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
    if (!drag.moved) {
      // Tap, not a drag. Trigger an idle speak.
      speak("idle");
      return;
    }
    // Compute release velocity from the trailing samples within the window.
    const now = performance.now();
    const cutoff = now - VELOCITY_SAMPLE_WINDOW_MS;
    const fresh = drag.samples.filter((s) => s.t >= cutoff);
    if (fresh.length >= 2) {
      const first = fresh[0];
      const last = fresh[fresh.length - 1];
      const dt = last.t - first.t || 1;
      let vx = (last.x - first.x) / dt;
      let vy = (last.y - first.y) / dt;
      const speed = Math.hypot(vx, vy);
      if (speed > MAX_VELOCITY_PX_PER_MS) {
        const k = MAX_VELOCITY_PX_PER_MS / speed;
        vx *= k;
        vy *= k;
      }
      if (Math.hypot(vx, vy) >= THROW_VELOCITY_PX_PER_MS) {
        velocityRef.current = { vx, vy };
        startBounceLoop();
      }
    }
    // Persist the resting position (or last position before bouncing).
    try {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(positionRef.current));
    } catch {
      /* private mode / storage full — non-fatal */
    }
  }

  const moodTint =
    line?.mood === "sad"
      ? "saturate(0.6) brightness(0.95)"
      : line?.mood === "sleepy"
        ? "saturate(0.85) brightness(0.95)"
        : line?.mood === "cheer"
          ? "saturate(1.15) brightness(1.05)"
          : undefined;

  if (!mounted) return null;

  // Suppress conflicting transforms while she's actively in motion so the
  // sprite tracks position cleanly.
  const inMotion = dragging || bouncingPhysics;
  const movementClass = dragging
    ? "cursor-grabbing"
    : bouncingPhysics
      ? "cursor-grab"
      : bouncing
        ? "animate-bounce cursor-grab"
        : "hover:-translate-y-0.5 cursor-grab";

  return (
    <div
      className="pointer-events-none fixed z-30 flex flex-col items-end gap-1"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        // While bouncing/dragging we ignore animation transitions so the
        // visual matches the rAF position exactly.
        transition: inMotion ? "none" : undefined,
      }}
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
        aria-label="Pisi the cat (drag to move, fling for DVD-bounce mode, tap to chat)"
        className={`pisi-mascot-frame pointer-events-auto select-none transition-transform ${movementClass}`}
        style={{ touchAction: "none" }}
      >
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
