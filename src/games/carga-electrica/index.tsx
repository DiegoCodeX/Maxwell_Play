import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./carga.css";

import { BALLOON_H, BALLOON_W, ROPE_LEN, EXPLANATION_VIDEO_PATH,
  PAPER_MAX_PULL, PAPER_MAX_ROT, PAPER_MAX_SCALE, PAPER_PULL_RADIUS, PAPER_PULL_SMOOTH,
  GRAVITY_BASE, GRAVITY_CHARGED, BOUNCE, AIR_FRICTION, WALL_BOUNCE, K_REPEL, MAX_REPEL_STEP } from "./constants";
import type { Balloon, ModalState } from "./types";
import { getLocalRect, onTopOfTable, makeElectrons } from "./utils";
import PersonHair from "./components/PersonHair";

export default function CargaElectrica() {
  const navigate = useNavigate();

  const gameRef = useRef<HTMLDivElement | null>(null);
  const hairRef = useRef<HTMLDivElement | null>(null);
  const balloonsAreaRef = useRef<HTMLDivElement | null>(null);
  const centerTableRef = useRef<HTMLDivElement | null>(null);
  const papersTableRef = useRef<HTMLDivElement | null>(null);

  const [balloons, setBalloons] = useState<Balloon[]>([
    { id: 1, color: "#45c2a8", pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, charged: false, falling: false, rope: 0 },
    { id: 2, color: "#e85d5d", pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, charged: false, falling: false, rope: 0 },
    { id: 3, color: "#f77f00", pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, charged: false, falling: false, rope: 0 },
    { id: 4, color: "#fcbf49", pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, charged: false, falling: false, rope: 0 },
  ]);

  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [feedback, setFeedback] = useState<ModalState>(null);
  const introShown = useRef(false);
  const chargedShown = useRef(false);

  const [papersAttracted, setPapersAttracted] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const winTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chargedCount = balloons.filter((b) => b.charged).length;

  // ===== drag =====
  function handlePointerDown(e: React.PointerEvent, id: number) {
    if (hasWon) return;
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDraggingId(id);
    target.setPointerCapture(e.pointerId);
    setBalloons((prev) => prev.map((b) => (b.id === id ? { ...b, vel: { x: 0, y: 0 }, rope: 0 } : b)));
  }
  function handlePointerMove(e: React.PointerEvent, id: number) {
    if (hasWon) return;
    if (draggingId !== id) return;
    const area = balloonsAreaRef.current;
    if (!area) return;
    const ar = area.getBoundingClientRect();
    const nx = e.clientX - ar.left - offset.x;
    const ny = e.clientY - ar.top - offset.y;
    setBalloons((prev) => prev.map((b) => (b.id === id ? { ...b, pos: { x: nx, y: ny } } : b)));
    maybeCharge(id, e.clientX, e.clientY);
    updatePaperAttraction(id, e.clientX, e.clientY);
  }
  // ===== papelitos helper: reset transform (declarado antes para useCallback deps)
  function resetPapersTransform() {
    const table = papersTableRef.current;
    if (!table) return;
    const papers = table.querySelectorAll<HTMLElement>(".paper-piece");
    papers.forEach((p) => {
      p.style.transition = "transform 0.35s ease-in";
      p.style.transform = "translate(0px, 0px) rotate(0deg) scale(1)";
    });
  }

  // ===== papelitos: update con useCallback para estabilidad
  const updatePaperAttraction = useCallback((id: number, clientX: number, clientY: number) => {
    const b = balloons.find((x) => x.id === id);
    const table = papersTableRef.current;
    if (!b || !table) return;

    if (!b.charged) {
      setPapersAttracted(false);
      resetPapersTransform();
      return;
    }

    const tr = table.getBoundingClientRect();
    const cx = tr.left + tr.width / 2;
    const cy = tr.top + tr.height / 2;
    const distToTable = Math.hypot(clientX - cx, clientY - cy);

    if (distToTable < PAPER_PULL_RADIUS) {
      setPapersAttracted(true);
      const papers = table.querySelectorAll<HTMLElement>(".paper-piece");
      papers.forEach((p, i) => {
        if (i % 2 !== 0) return;
        const pr = p.getBoundingClientRect();
        const px = pr.left + pr.width / 2;
        const py = pr.top + pr.height / 2;

        const dx = clientX - px;
        const dy = clientY - py;
        const d  = Math.hypot(dx, dy) || 1;

        const pull = Math.min(PAPER_MAX_PULL, (1 - d / PAPER_PULL_RADIUS) * PAPER_MAX_PULL);
        const tx = (dx / d) * pull * PAPER_PULL_SMOOTH;
        const ty = (dy / d) * pull * PAPER_PULL_SMOOTH;

        const rand = parseFloat(p.dataset.rand || "0");
        const jitter = (rand - 0.5) * 10;
        const rot = (rand - 0.5) * PAPER_MAX_ROT;
        const scl = 1 + (1 - Math.min(d / PAPER_PULL_RADIUS, 1)) * (PAPER_MAX_SCALE - 1) * 0.7;

        p.style.transition = "transform 0.18s ease-out";
        p.style.transform = `translate(${tx + jitter}px, ${ty}px) rotate(${rot}deg) scale(${scl})`;
      });
    } else {
      setPapersAttracted(false);
      resetPapersTransform();
    }
  }, [balloons, papersTableRef]);

  // finish drag en useCallback (estable para useEffect)
  const finishDragAtClient = useCallback((id: number, clientX: number, clientY: number) => {
    const area = balloonsAreaRef.current;
    const table = centerTableRef.current;
    if (!area) return;
    const tr = table ? getLocalRect(table, area) : null;

    setBalloons((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (tr) {
          const topTouch = Math.abs(b.pos.y + BALLOON_H - tr.y) <= 8;
          const overlapX = b.pos.x + BALLOON_W > tr.x && b.pos.x < tr.x + tr.w;
          if (topTouch && overlapX) {
            return { ...b, pos: { x: b.pos.x, y: tr.y - BALLOON_H }, vel: { x: 0, y: 0 }, falling: false };
          }
        }
        return { ...b, vel: { x: 0, y: 0 }, falling: true };
      }),
    );
    updatePaperAttraction(id, clientX, clientY);
  }, [balloonsAreaRef, centerTableRef, updatePaperAttraction]);

  function handlePointerUp(e: React.PointerEvent, id: number) {
    if (hasWon) return;
    try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    if (draggingId === id) setDraggingId(null);
    finishDragAtClient(id, e.clientX, e.clientY);
  }

  useEffect(() => {
    function onWinPointerUp(ev: PointerEvent) {
      if (hasWon) return;
      if (draggingId == null) return;
      finishDragAtClient(draggingId, ev.clientX, ev.clientY);
      setDraggingId(null);
    }
    window.addEventListener("pointerup", onWinPointerUp);
    return () => window.removeEventListener("pointerup", onWinPointerUp);
  }, [draggingId, hasWon, finishDragAtClient]);

  // ===== carga por fricción =====
  function maybeCharge(id: number, clientX: number, clientY: number) {
    if (hasWon) return;
    const hair = hairRef.current;
    if (!hair) return;
    const hr = hair.getBoundingClientRect();
    const inside = clientX >= hr.left && clientX <= hr.right && clientY >= hr.top && clientY <= hr.bottom;
    if (inside) {
      let becameCharged = false;
      setBalloons(prev => prev.map(b => {
        if (b.id !== id) return b;
        if (b.charged) return b;
        becameCharged = true;
        return { ...b, charged: true, electrons: makeElectrons() };
      }));
      if (becameCharged && !chargedShown.current) chargedShown.current = true;

      hair.classList.add("animate-wiggle");
      setTimeout(() => hair.classList.remove("animate-wiggle"), 520);

      // chispas
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const s = document.createElement("div");
          s.className = "w-1 h-1 rounded-full bg-yellow-300 opacity-100 animate-sparkle";
          s.style.position = "fixed";
          s.style.left = `${clientX + (Math.random() * 24 - 12)}px`;
          s.style.top  = `${clientY + (Math.random() * 24 - 12)}px`;
          document.body.appendChild(s);
          setTimeout(() => s.remove(), 520);
        }, i * 80);
      }
    }
  }

  // (Las funciones relacionadas con papelitos están definidas arriba y se usan desde aquí)
  useEffect(() => {
    const table = papersTableRef.current;
    if (!table) return;
    const papers = table.querySelectorAll<HTMLElement>(".paper-piece");
    papers.forEach((p) => { if (!p.dataset.rand) p.dataset.rand = Math.random().toFixed(3); });
  }, []);

  // ===== victoria =====
  useEffect(() => {
    if (hasWon) return;
    const ok = chargedCount > 0 && papersAttracted;
    if (ok && !winTimer.current) {
      winTimer.current = setTimeout(() => {
        setHasWon(true);
        setFeedback({
          title: "¡Felicitaciones! 🎉",
          body:
            "Cargaste un globo por fricción y lograste atraer los papelitos.\n\nCuando estés listo, pulsa «Continuar». Luego verás el botón «Explicación».",
        });
      }, 1200);
    }
    if (!ok && winTimer.current) {
      clearTimeout(winTimer.current);
      winTimer.current = null;
    }
    return () => { if (winTimer.current) { clearTimeout(winTimer.current); winTimer.current = null; } };
  }, [chargedCount, papersAttracted, hasWon]);

  // ===== física =====
  useEffect(() => {
    let raf = 0, t = 0;
    const step = () => {
      const area = balloonsAreaRef.current;
      const tableEl = centerTableRef.current;
      if (!area || !tableEl) { raf = requestAnimationFrame(step); return; }

      const tr = getLocalRect(tableEl, area)!;
      const minX = tr.x;
      const maxX = tr.x + tr.w - BALLOON_W;
      const minY = tr.y;
      const maxY = tr.y + tr.h - BALLOON_H;

      setBalloons((prev) => {
        const fx: number[] = new Array(prev.length).fill(0);
        const fy: number[] = new Array(prev.length).fill(0);

        for (let i = 0; i < prev.length; i++) {
          const bi = prev[i];
          if (!bi.charged) continue;
          for (let j = i + 1; j < prev.length; j++) {
            const bj = prev[j];
            if (!bj.charged) continue;
            const dx = bi.pos.x - bj.pos.x;
            const dy = bi.pos.y - bj.pos.y;
            const d2 = dx * dx + dy * dy + 60;
            const d  = Math.sqrt(d2);
            const f  = Math.min(MAX_REPEL_STEP, K_REPEL / d2);
            const nx = dx / d, ny = dy / d;
            fx[i] += nx * f; fy[i] += ny * f;
            fx[j] -= nx * f; fy[j] -= ny * f;
          }
        }

        return prev.map((b, idx) => {
          const advanceElectrons = (bb: Balloon) => {
            let electrons = bb.electrons;
            if (bb.charged) {
              if (!electrons || electrons.length === 0) electrons = makeElectrons();
              const rx = BALLOON_W * 0.32, ry = BALLOON_H * 0.38;
              electrons = electrons.map((e) => {
                const angle = e.angle + e.speed;
                const xRel = BALLOON_W / 2 + Math.cos(angle) * rx * e.radius;
                const yRel = BALLOON_H / 2 + Math.sin(angle) * ry * e.radius;
                return { ...e, angle, x: xRel, y: yRel };
              });
            }
            return electrons;
          };

          if (draggingId === b.id || hasWon) {
            const targetRope = Math.max(-10, Math.min(10, -0.6 * b.vel.x));
            const rope = b.rope + (targetRope - b.rope) * 0.2;
            const electrons = advanceElectrons(b);
            return { ...b, rope, electrons };
          }

          let { x, y } = b.pos;
          let { x: vx, y: vy } = b.vel;
          let { falling } = b;

          const enMesa = onTopOfTable(b, tr);
          if (!enMesa && y < maxY) falling = true;

          vy += b.charged ? GRAVITY_CHARGED : GRAVITY_BASE;

          if (b.charged) {
            vx += 0.02 * Math.cos(t * 0.12 + b.id * 1.7);
            vy -= 0.015 * Math.sin(t * 0.15 + b.id * 2.1);
            vx += fx[idx];
            vy += fy[idx];
          }

          if (vy > 0) {
            const hitsX = x + BALLOON_W > minX && x < maxX + BALLOON_W;
            const bottom = y + BALLOON_H;
            if (hitsX && bottom >= minY && bottom <= minY + 10) {
              y = minY - BALLOON_H; vy = 0; vx *= 0.82; falling = false;
            }
          }

          if (y >= maxY) { y = maxY; vy = -vy * BOUNCE; if (Math.abs(vy) < 0.7) vy = 0; if (Math.abs(vx) < 0.1) vx = 0; }
          if (x <= minX) { x = minX; vx = -vx * WALL_BOUNCE; }
          if (x >= maxX) { x = maxX; vx = -vx * WALL_BOUNCE; }
          if (y <  minY) { y = minY; vy = -vy * BOUNCE; }

          vx *= AIR_FRICTION; vy *= AIR_FRICTION;

          const targetRope = Math.max(-14, Math.min(14, -0.9 * vx + 1.2 * Math.sin(t * 0.08 + b.id)));
          const rope = b.rope + (targetRope - b.rope) * 0.15;

          const electrons = advanceElectrons(b);
          return { ...b, pos: { x, y }, vel: { x: vx, y: vy }, falling, rope, electrons };
        });
      });

      t += 1;
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [draggingId, hasWon]);

  // ===== keyframes (ya están en CSS) =====

  // Layout inicial + intro
  const resetGame = useCallback(() => {
    const area = balloonsAreaRef.current;
    const table = centerTableRef.current;
    if (!area || !table) return;

    const tr = getLocalRect(table, area)!;
    const cols = 4;
    const spacing = tr.w / (cols + 1);

    setBalloons((prev) =>
      prev.map((b, i) => {
        const x = tr.x + spacing * (i + 1) - BALLOON_W / 2;
        const y = tr.y - BALLOON_H - 2;
        return { ...b, charged: false, vel: { x: 0, y: 0 }, pos: { x, y }, falling: false, rope: 0, electrons: [] };
      }),
    );

    setHasWon(false);
    setPapersAttracted(false);
    resetPapersTransform();
    if (winTimer.current) { clearTimeout(winTimer.current); winTimer.current = null; }

    introShown.current = false;
    chargedShown.current = false;

    setTimeout(() => {
      if (!introShown.current) {
        introShown.current = true;
        setFeedback({
          title: "👋 ¡Bienvenido!",
          body:
            "Objetivo: demostrar la atracción eléctrica.\n\n1) Toma un globo.\n2) Frótalo con el cabello del personaje.\n3) Acércalo a los papelitos.",
        });
      }
    }, 50);
  }, []);

  useEffect(() => { setTimeout(() => resetGame(), 0); }, [resetGame]);

  // ID estable para el juego
  const GAME_ID = "carga-electrica";
  const showManual = () => setFeedback({
    title: "📖 Manual",
    body: "1) Frota el globo con el cabello para cargarlo.\n2) Acércalo a los papelitos para ver la atracción.",
  });
  // Navega al video de explicación pasando el gameId
  const showExplanation = () =>
    navigate("/explicacion", {
      state: { src: EXPLANATION_VIDEO_PATH, gameId: GAME_ID },
    });
  const showExplanationBtn = hasWon && !feedback;

  return (
    <div
      ref={gameRef}
      className="w-full relative flex flex-col bg-gradient-to-br from-indigo-400 to-purple-700 overflow-hidden"
      style={{ minHeight: "100dvh", height: "100dvh" }}
    >
      <Link to="/" className="absolute top-4 left-4 z-50 px-4 py-3 rounded-xl bg-white/20 text-white font-extrabold text-xl md:text-2xl hover:bg-white/30">← Menú</Link>

  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 relative">
  <PersonHair hairRef={hairRef as React.RefObject<HTMLDivElement>} disabled={hasWon} />

        {/* Papelitos */}
        <div className="flex flex-col items-end md:col-start-3 md:justify-self-end md:place-self-end md:mr-6">
          <div ref={papersTableRef} className="relative w-[450px] h-[100px] bg-amber-800 rounded-lg mb-9 shadow-lg">
            <div className="absolute left-5 -bottom-10 w-2 h-10 bg-amber-900" />
            <div className="absolute right-5 -bottom-10 w-2 h-10 bg-amber-900" />
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[100px] flex flex-wrap gap-1 justify-center">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="paper-piece w-[15px] h-[15px] bg-white rounded-sm"
                  style={{
                    transition: "transform 0.35s ease",
                    willChange: "transform",
                    animation: !papersAttracted ? "paperFloat 2.4s ease-in-out infinite" : "none",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="w-full flex justify-end pr-1 md:pr-20">
            <div className="text-white font-extrabold text-2xl md:text-3xl">Papelitos</div>
          </div>
        </div>

        {/* Área central con mesa + globos */}
        <div ref={balloonsAreaRef} className="relative md:col-span-3 rounded-xl overflow-visible" style={{ height: "50vh" }}>
          <div
            ref={centerTableRef}
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: 110, width: "calc(100vw - 96px)", maxWidth: "1500px", height: "110px",
              borderRadius: "1rem", backgroundColor: "#92400e",
              boxShadow: "0 30px 80px rgba(0,0,0,.25), inset 0 -8px 0 rgba(0,0,0,0.12)",
              border: "1px solid #78350f",
            }}
            title="Mesa central"
          >
            <div className="absolute left-10 -bottom-8 w-3 h-10 bg-amber-900 rounded-md" />
            <div className="absolute right-10 -bottom-8 w-3 h-10 bg-amber-900 rounded-md" />
            <div className="absolute inset-x-0 top-0 h-3 rounded-t-2xl bg-amber-700/40 pointer-events-none" />
          </div>

          {balloons.map((b) => (
            <div
              key={b.id}
              onPointerDown={(e) => handlePointerDown(e, b.id)}
              onPointerMove={(e) => handlePointerMove(e, b.id)}
              onPointerUp={(e) => handlePointerUp(e, b.id)}
              className="absolute z-10 cursor-grab active:cursor-grabbing select-none"
              style={{ left: b.pos.x, top: b.pos.y, width: BALLOON_W, height: BALLOON_H, touchAction: "none", pointerEvents: hasWon ? "none" : "auto" }}
              title={b.charged ? "Cargado" : "Arrástrame"}
            >
              {/* Cuerda */}
              <svg style={{ position: "absolute", left: 0, top: BALLOON_H - 2, pointerEvents: "none" }} width={BALLOON_W} height={ROPE_LEN} viewBox={`0 0 ${BALLOON_W} ${ROPE_LEN}`}>
                {(() => {
                  const x0 = BALLOON_W / 2, y0 = 0;
                  const x1 = BALLOON_W / 2 + b.rope, y1 = ROPE_LEN;
                  const cx = (x0 + x1) / 2 + b.rope * 0.35;
                  const cy = ROPE_LEN * 0.55;
                  const d  = `M ${x0},${y0} Q ${cx},${cy} ${x1},${y1}`;
                  return (<><path d={d} stroke="#1f2937" strokeWidth="2" fill="none" /><circle cx={x1} cy={y1} r="2.1" fill="#111827" /></>);
                })()}
              </svg>

              {/* Globo */}
              <div
                className={`relative transition-transform ${draggingId === b.id ? "scale-105" : b.charged ? "animate-balloonWobble" : ""}`}
                style={{
                  width: "100%", height: "100%", borderRadius: "50% / 55%",
                  background: `radial-gradient(120% 120% at 30% 25%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 10%, ${b.color} 60%, ${b.color} 100%)`,
                  boxShadow: b.charged ? "0 0 22px rgba(255,255,0,0.85), inset 0 -8px 14px rgba(0,0,0,0.15)"
                                    : "inset 0 -8px 14px rgba(0,0,0,0.15)",
                  filter: b.charged ? "saturate(1.08) contrast(1.05)" : "none",
                }}
              >
                {b.charged && (b.electrons ?? []).map((e, i) => (
                  <div key={i} style={{
                    position: "absolute", left: e.x - e.size / 2, top: e.y - e.size / 2,
                    width: e.size, height: e.size, borderRadius: "50%",
                    background: "radial-gradient(circle at 30% 30%, #a5d8ff 0%, #60a5fa 40%, #2563eb 100%)",
                    boxShadow: "0 0 6px rgba(96,165,250,.9)", opacity: 0.95,
                  }}/>
                ))}
                <div className="pointer-events-none" style={{ position: "absolute", left: "7%", top: "10%", width: "28%", height: "28%", borderRadius: "50%", background: "rgba(255,255,255,0.5)", filter: "blur(2px)", opacity: 0.7 }} />
                <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%) rotate(45deg)", bottom: "-6%", width: "12%", height: "12%", background: "#27272a", borderRadius: "3px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botonera */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-md z-[100]">
        <button onClick={resetGame} className="px-4 py-2 rounded-lg font-bold text-white bg-rose-500 hover:bg-rose-600 transition">🔄 Reiniciar</button>
        <button onClick={showManual} className="px-4 py-2 rounded-lg font-bold text-white bg-amber-500 hover:bg-amber-600 transition">📖 Manual</button>
        {showExplanationBtn && (
          <button onClick={() => showExplanation()} className="px-4 py-2 rounded-lg font-bold text-white bg-sky-500 hover:bg-sky-600 transition">➡️ Explicación</button>
        )}
      </div>

      {feedback && (
        <div className="fixed inset-0 grid place-items-center p-4 z-[120]">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white text-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-extrabold mb-2">{feedback.title}</h3>
            <p className="mb-4 whitespace-pre-line">{feedback.body}</p>
            <div className="text-right">
              <button onClick={() => setFeedback(null)} className="px-4 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition">Continuar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
