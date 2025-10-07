import { useEffect, useRef } from "react";
import type { Emitter } from "./types";
import { RIPPLE_BASE_ALPHA, RIPPLE_MAX_R, RIPPLE_PERIOD, RIPPLE_RING_GAP } from "./constants";

export function useRippleEmitters(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const rafRef = useRef<number | null>(null);
  const emittersRef = useRef<Record<string, Emitter>>({});

  // Ajusta el canvas al viewport
  useEffect(() => {
    const fit = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [canvasRef]);

  const startAnim = () => {
    if (rafRef.current) return;
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;

    const draw = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, c.width, c.height);

      const emitters = Object.values(emittersRef.current);
      if (emitters.length) {
        for (const em of emitters) {
          const t = (now % RIPPLE_PERIOD) / RIPPLE_PERIOD;
          const baseR = t * RIPPLE_MAX_R;
          for (let k = 0; k < 8; k++) {
            const r = baseR - k * RIPPLE_RING_GAP;
            if (r <= 10 || r >= RIPPLE_MAX_R) continue;
            const alpha = RIPPLE_BASE_ALPHA * (0.65 + 0.35 * Math.sin((r / RIPPLE_RING_GAP) * Math.PI));
            ctx.beginPath();
            ctx.arc(em.x, em.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${em.hue}, 90%, 60%, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }

      if (Object.keys(emittersRef.current).length) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(draw);
  };

  const ensureAnim = () => {
    if (!rafRef.current && Object.keys(emittersRef.current).length) startAnim();
  };

  const addEmitter = (key: string, x: number, y: number, hue = 205) => {
    emittersRef.current[key] = { x, y, hue, key };
    ensureAnim();
  };

  const removeEmitter = (key: string) => { delete emittersRef.current[key]; };
  const removeAllEmitters = () => { emittersRef.current = {}; };

  // cleanup si desmonta
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return { addEmitter, removeEmitter, removeAllEmitters };
}
