import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { GameState } from "./types";
import { clamp } from "./utils";

// 🔗 Imágenes desde src/assets (Vite las resuelve a URL)
import framePng from "@/assets/bike-frame.png";
import wheelPng from "@/assets/wheel.png";
import dynamoPng from "@/assets/dynamo.png";

/** ======= CONFIGURACIÓN DE LAYOUT (ajústalo si tu PNG no calza perfecto) ======= */
// viewBox 900x520
const FRAME = {
  // dónde se dibuja el PNG del marco
  x: 84,
  y: 153,
  w: 650,
  h: 420,
  // ejes donde deben “encajar” las ruedas (coincidir con la imagen)
  axleFront: { x: 260, y: 375 },
  axleRear: { x: 465, y: 375 },
};

// tamaño lógico para centrar la rueda PNG (ajusta si hace falta)
const WHEEL_R = 60;

// Dínamo: offsets relativos al centro del grupo (0,0)
const DYN = {
  w: 110,
  h: 70,
  roller: { x: 48, y: 0 }, // rodillo a la derecha
  plus: { x: -28, y: -30 },
  minus: { x: 28, y: -30 },
};

// contacto en la rueda trasera (izquierda)
const REAR_CONTACT = { x: -WHEEL_R - 10, y: 0 };

// tolerancia de “snap” al soltar
const SNAP = 16;

/** ✨ POSICIONES INICIALES (dónde aparecen al iniciar/resetear)
 *  Cambia SOLO aquí para mover las llantas al comenzar.
 *  NO toca los ejes verdes (FRAME.axleFront/axleRear), así que el snap sigue igual.
 */
const START = {
  wheelFront: { x: 640, y: 330 }, // ← mueve la rueda delantera (inicio)
  wheelRear:  { x: 160, y: 430 }, // ← mueve la rueda trasera (inicio)
  dynamo:     { x: 110, y: 320 }, // (opcional) posición inicial de la dínamo
};

export default function CiclaDinamo() {
  const [state, setState] = useState<GameState>({
    wheelsMounted: { front: false, rear: false },
    dynamoOnWheel: false,
    connections: { plus: false, minus: false },
    pedaling: false,
    cadence: 0,
    power: 0,
  });

  const sceneRef = useRef<SVGSVGElement | null>(null);

  // grupos y elementos clave
  const gFront = useRef<SVGGElement | null>(null);
  const gRear = useRef<SVGGElement | null>(null);
  const rotFront = useRef<SVGGElement | null>(null);
  const rotRear = useRef<SVGGElement | null>(null);
  const gDyn = useRef<SVGGElement | null>(null);

  const axleFront = useRef<SVGCircleElement | null>(null);
  const axleRear = useRef<SVGCircleElement | null>(null);
  const axleFrontGlow = useRef<SVGCircleElement | null>(null);
  const axleRearGlow = useRef<SVGCircleElement | null>(null);

  const rearContact = useRef<SVGCircleElement | null>(null);
  const rearContactGlow = useRef<SVGCircleElement | null>(null);

  const dynPlus = useRef<SVGCircleElement | null>(null);
  const dynMinus = useRef<SVGCircleElement | null>(null);
  const bulbPlus = useRef<SVGCircleElement | null>(null);
  const bulbMinus = useRef<SVGCircleElement | null>(null);
  const dynPlusGlow = useRef<SVGCircleElement | null>(null);
  const dynMinusGlow = useRef<SVGCircleElement | null>(null);
  const bulbPlusGlow = useRef<SVGCircleElement | null>(null);
  const bulbMinusGlow = useRef<SVGCircleElement | null>(null);

  const wirePlus = useRef<SVGLineElement | null>(null);
  const wireMinus = useRef<SVGLineElement | null>(null);
  const leadPlusA = useRef<SVGCircleElement | null>(null);
  const leadPlusB = useRef<SVGCircleElement | null>(null);
  const leadMinusA = useRef<SVGCircleElement | null>(null);
  const leadMinusB = useRef<SVGCircleElement | null>(null);

  const bulbGlass = useRef<SVGEllipseElement | null>(null);
  const fill = useRef<HTMLDivElement | null>(null);
  const pct = useRef<HTMLDivElement | null>(null);

  const [hint, setHint] = useState(
    "Las zonas de destino se iluminan al tomar una pieza."
  );
  const [toast, setToast] = useState<string | null>(null);

  // ===== utilidades SVG
  const bringToFront = (el?: Element | null) =>
    el?.parentNode?.appendChild(el);
  const clientToSvg = (cx: number, cy: number) => {
    const s = sceneRef.current!;
    const pt = s.createSVGPoint();
    pt.x = cx;
    pt.y = cy;
    return pt.matrixTransform(s.getScreenCTM()!.inverse());
  };
  const center = (el: SVGGraphicsElement) => {
    const b = el.getBoundingClientRect();
    const c = clientToSvg(b.left + b.width / 2, b.top + b.height / 2);
    return { x: c.x, y: c.y };
  };
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  // ===== Drag de grupos
  const dragGroup = (
    g: SVGGElement,
    onStart?: () => void,
    onDrop?: () => void
  ) => {
    let dragging = false,
      start = { x: 0, y: 0 },
      base = { x: 0, y: 0 };
    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      dragging = true;
      g.setPointerCapture(e.pointerId);
      bringToFront(g);
      const m = g.transform.baseVal.consolidate()?.matrix;
      base = { x: m ? m.e : 0, y: m ? m.f : 0 };
      start = clientToSvg(e.clientX, e.clientY);
      onStart?.();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const p = clientToSvg(e.clientX, e.clientY);
      g.setAttribute(
        "transform",
        `translate(${base.x + p.x - start.x},${base.y + p.y - start.y})`
      );
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      onDrop?.();
    };
    g.addEventListener("pointerdown", onDown);
    g.addEventListener("pointermove", onMove);
    g.addEventListener("pointerup", onUp);
    g.addEventListener("pointercancel", onUp);
    return () => {
      g.removeEventListener("pointerdown", onDown);
      g.removeEventListener("pointermove", onMove);
      g.removeEventListener("pointerup", onUp);
      g.removeEventListener("pointercancel", onUp);
    };
  };

  // ===== Cables de dos puntas
  const setupTwoEnded = (
    role: "plus" | "minus",
    leadA: SVGCircleElement,
    leadB: SVGCircleElement,
    wire: SVGLineElement
  ) => {
    const dynT = role === "plus" ? dynPlus.current! : dynMinus.current!;
    const bulbT = role === "plus" ? bulbPlus.current! : bulbMinus.current!;
    const start = center(dynT);

    leadA.setAttribute("cx", String(start.x));
    leadA.setAttribute("cy", String(start.y));
    wire.setAttribute("x1", String(start.x));
    wire.setAttribute("y1", String(start.y));

    const off = role === "plus" ? { x: 140, y: 296 } : { x: 200, y: 328 };
    leadB.setAttribute("cx", String(off.x));
    leadB.setAttribute("cy", String(off.y));
    wire.setAttribute("x2", String(off.x));
    wire.setAttribute("y2", String(off.y));

    const gOn = role === "plus" ? dynPlusGlow.current! : dynMinusGlow.current!;
    const bOn = role === "plus" ? bulbPlusGlow.current! : bulbMinusGlow.current!;

    const attach = (lead: SVGCircleElement, end: "A" | "B") => {
    let dragging = false;
    const prev = { x: +lead.getAttribute("cx")!, y: +lead.getAttribute("cy")! };
      let activePointerId: number | null = null;
      let rafId: number | null = null;
      let lastPos: { x: number; y: number } | null = null;

      const updateFromLast = () => {
        if (!lastPos) return;
        const p = lastPos;
        lead.setAttribute("cx", String(p.x));
        lead.setAttribute("cy", String(p.y));
        if (end === "A") {
          wire.setAttribute("x1", String(p.x));
          wire.setAttribute("y1", String(p.y));
        } else {
          wire.setAttribute("x2", String(p.x));
          wire.setAttribute("y2", String(p.y));
        }
        rafId = null;
      };

      const onDown = (e: PointerEvent) => {
        e.preventDefault();
        dragging = true;
        activePointerId = e.pointerId;
        try {
          (e.target as Element).setPointerCapture(e.pointerId);
        } catch (err) {
          // ignore: some browsers may throw if setPointerCapture isn't available
          void err;
        }
        bringToFront(wire);
        bringToFront(lead);
        gOn.classList.add("show");
        bOn.classList.add("show");

        // listeners globales durante el drag
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
      };

      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        if (activePointerId !== null && e.pointerId !== activePointerId) return;
        const p = clientToSvg(e.clientX, e.clientY);
        lastPos = { x: p.x, y: p.y };
        if (rafId == null) rafId = window.requestAnimationFrame(updateFromLast);
      };

      const onUp = (e?: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        if (activePointerId !== null && e && (e.pointerId === undefined || e.pointerId === activePointerId)) {
          try { (e.target as Element).releasePointerCapture(activePointerId); } catch (err) { void err; }
        }
        activePointerId = null;

        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        if (rafId) { window.cancelAnimationFrame(rafId); rafId = null; }

        // comprobar snap
        const lp = center(lead), td = center(dynT), tb = center(bulbT);
        let snapped = false;
        if (dist(lp, td) < SNAP) {
          lead.setAttribute("cx", String(td.x));
          lead.setAttribute("cy", String(td.y));
          if (end === "A") { wire.setAttribute("x1", String(td.x)); wire.setAttribute("y1", String(td.y)); }
          else { wire.setAttribute("x2", String(td.x)); wire.setAttribute("y2", String(td.y)); }
          snapped = true;
        } else if (dist(lp, tb) < SNAP) {
          lead.setAttribute("cx", String(tb.x));
          lead.setAttribute("cy", String(tb.y));
          if (end === "A") { wire.setAttribute("x1", String(tb.x)); wire.setAttribute("y1", String(tb.y)); }
          else { wire.setAttribute("x2", String(tb.x)); wire.setAttribute("y2", String(tb.y)); }
          snapped = true;
        }
        if (!snapped) {
          lead.setAttribute("cx", String(prev.x));
          lead.setAttribute("cy", String(prev.y));
          if (end === "A") { wire.setAttribute("x1", String(prev.x)); wire.setAttribute("y1", String(prev.y)); }
          else { wire.setAttribute("x2", String(prev.x)); wire.setAttribute("y2", String(prev.y)); }
        }
        gOn.classList.remove("show");
        bOn.classList.remove("show");
        checkConnections();
      };

      lead.addEventListener("pointerdown", onDown);
      return () => {
        lead.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        if (rafId) { window.cancelAnimationFrame(rafId); }
      };
    };

    const cA = attach(leadA, "A");
    const cB = attach(leadB, "B");
    return () => { cA(); cB(); };
  };

  const checkConnections = () => {
    const dP = center(dynPlus.current!);
    const bP = center(bulbPlus.current!);
    const dM = center(dynMinus.current!);
    const bM = center(bulbMinus.current!);
    const pA = center(leadPlusA.current!);
    const pB = center(leadPlusB.current!);
    const mA = center(leadMinusA.current!);
    const mB = center(leadMinusB.current!);

    const plus =
      (dist(pA, dP) < 14 && dist(pB, bP) < 14) ||
      (dist(pB, dP) < 14 && dist(pA, bP) < 14);
    const minus =
      (dist(mA, dM) < 14 && dist(mB, bM) < 14) ||
      (dist(mB, dM) < 14 && dist(mA, bM) < 14);

    setState((s) => ({ ...s, connections: { plus, minus } }));
  };

  // ===== pedalear
  useEffect(() => {
    let id: number | undefined;
    if (state.pedaling) {
      rotFront.current?.classList.add("spin");
      rotRear.current?.classList.add("spin");
      const loop = () => {
        setState((s) => ({
          ...s,
          cadence: clamp(s.cadence + 0.06, 0, 1),
          power: clamp(s.power * 0.85 + (s.dynamoOnWheel ? 1 : 0.2) * s.cadence * 25, 0, 100),
        }));
        id = window.setTimeout(loop, 120);
      };
      loop();
    } else {
      rotFront.current?.classList.remove("spin");
      rotRear.current?.classList.remove("spin");
      const cool = () => {
        setState((s) => ({
          ...s,
          cadence: clamp(s.cadence - 0.08, 0, 1),
          power: clamp(s.power - 4, 0, 100),
        }));
        if (id) window.setTimeout(cool, 120);
      };
      cool();
    }
    return () => {
      if (id) window.clearTimeout(id);
    };
  }, [state.pedaling]);

  // medidor / bombillo / hints
  const step1 = state.wheelsMounted.front && state.wheelsMounted.rear;
  const step2 = step1 && state.dynamoOnWheel;
  const step3 = step2 && state.connections.plus && state.connections.minus;
  const ready = step3;

  useEffect(() => {
    if (fill.current) fill.current.style.width = `${state.power | 0}%`;
    if (pct.current) pct.current.textContent = `${state.power | 0}%`;
    const ok = state.power >= 60 && ready;
    bulbGlass.current?.classList.toggle("bulb-lit", ok);

    if (!step1) setHint("Encaja las dos ruedas en los ejes verdes.");
    else if (!state.dynamoOnWheel)
      setHint("Apoya la dínamo: su rodillo debe tocar la rueda trasera (izquierda).");
    else if (!step3)
      setHint("Conecta cables: rojo al + y negro al – (en la dínamo y el bombillo).");
    else setHint("¡Listo! Pedalea y mantén la potencia > 60%.");
  }, [state, ready, step1, step3]);

  // listeners: ruedas, dínamo, cables
  useEffect(() => {
    // ruedas
    const cleanFront = gFront.current
      ? dragGroup(
          gFront.current,
          () => axleFrontGlow.current?.classList.add("show"),
          () => {
            axleFrontGlow.current?.classList.remove("show");
            const c = center(gFront.current!);
            const t = center(axleFront.current!);
            if (dist(c, t) < SNAP) {
              gFront.current!.setAttribute("transform", `translate(${t.x},${t.y})`);
              setState((v) => ({
                ...v,
                wheelsMounted: { ...v.wheelsMounted, front: true },
              }));
            }
          }
        )
      : undefined;

    const cleanRear = gRear.current
      ? dragGroup(
          gRear.current,
          () => axleRearGlow.current?.classList.add("show"),
          () => {
            axleRearGlow.current?.classList.remove("show");
            const c = center(gRear.current!);
            const t = center(axleRear.current!);
            if (dist(c, t) < SNAP) {
              gRear.current!.setAttribute("transform", `translate(${t.x},${t.y})`);
              setState((v) => ({
                ...v,
                wheelsMounted: { ...v.wheelsMounted, rear: true },
              }));
            }
          }
        )
      : undefined;

    // dínamo
    const cleanDyn = gDyn.current
      ? dragGroup(
          gDyn.current,
          () => rearContactGlow.current?.classList.add("show"),
          () => {
            rearContactGlow.current?.classList.remove("show");
            const gC = center(gDyn.current!);
            const roll = { x: gC.x + DYN.roller.x, y: gC.y + DYN.roller.y };
            const contact = center(rearContact.current!);
            if (dist(roll, contact) < SNAP) {
              const m = gDyn.current!.transform.baseVal.consolidate()?.matrix;
              const bx = m ? m.e : 0;
              const by = m ? m.f : 0;
              const dx = contact.x - roll.x - 2;
              const dy = contact.y - roll.y;
              gDyn.current!.setAttribute("transform", `translate(${bx + dx},${by + dy})`);
              bringToFront(gDyn.current);
              bringToFront(sceneRef.current!.querySelector("#wires"));
              setState((v) => ({ ...v, dynamoOnWheel: true }));
            }
          }
        )
      : undefined;

    // cables
    const cp =
      leadPlusA.current && leadPlusB.current && wirePlus.current
        ? setupTwoEnded("plus", leadPlusA.current, leadPlusB.current, wirePlus.current)
        : undefined;
    const cm =
      leadMinusA.current && leadMinusB.current && wireMinus.current
        ? setupTwoEnded("minus", leadMinusA.current, leadMinusB.current, wireMinus.current)
        : undefined;

    return () => {
      if (cleanFront) cleanFront();
      if (cleanRear) cleanRear();
      if (cleanDyn) cleanDyn();
      if (cp) cp();
      if (cm) cm();
    };
    // deps intentionally empty: anchors y refs son estables
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reset (usa START para posiciones iniciales de llantas/dínamo)
  const reset = () => {
    setState({
      wheelsMounted: { front: false, rear: false },
      dynamoOnWheel: false,
      connections: { plus: false, minus: false },
      pedaling: false,
      cadence: 0,
      power: 0,
    });

    gFront.current?.setAttribute(
      "transform",
      `translate(${START.wheelFront.x},${START.wheelFront.y})`
    );
    gRear.current?.setAttribute(
      "transform",
      `translate(${START.wheelRear.x},${START.wheelRear.y})`
    );
    gDyn.current?.setAttribute(
      "transform",
      `translate(${START.dynamo.x},${START.dynamo.y})`
    );

    const dP = center(dynPlus.current!);
    const dM = center(dynMinus.current!);

    if (leadPlusA.current && leadPlusB.current && wirePlus.current) {
      leadPlusA.current.setAttribute("cx", String(dP.x));
      leadPlusA.current.setAttribute("cy", String(dP.y));
      leadPlusB.current.setAttribute("cx", "140");
      leadPlusB.current.setAttribute("cy", "296");
      wirePlus.current.setAttribute("x1", String(dP.x));
      wirePlus.current.setAttribute("y1", String(dP.y));
      wirePlus.current.setAttribute("x2", "140");
      wirePlus.current.setAttribute("y2", "296");
    }
    if (leadMinusA.current && leadMinusB.current && wireMinus.current) {
      leadMinusA.current.setAttribute("cx", String(dM.x));
      leadMinusA.current.setAttribute("cy", String(dM.y));
      leadMinusB.current.setAttribute("cx", "200");
      leadMinusB.current.setAttribute("cy", "328");
      wireMinus.current.setAttribute("x1", String(dM.x));
      wireMinus.current.setAttribute("y1", String(dM.y));
      wireMinus.current.setAttribute("x2", "200");
      wireMinus.current.setAttribute("y2", "328");
    }
  };

  const pedalToggle = () =>
    step3 && setState((s) => ({ ...s, pedaling: !s.pedaling }));
  const show = (msg: string, ms = 3500) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };
  

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-[#1e3c72] to-[#2a5298] select-none">
      {/* estilos locales */}
      <style>{`
        .title{color:#fff;text-align:center;font-weight:800;font-size:clamp(1.2rem,2.4vw,2.2rem);padding:14px 16px;background:rgba(255,255,255,.06)}
        svg{max-width:min(900px,92vw);height:auto;touch-action:none}
        .wheel,.dynamo,.lead{cursor:grab}
        .wheel:active,.dynamo:active,.lead:active{cursor:grabbing}
        .rotor{transform-box:fill-box;transform-origin:50% 50%}
        .spin{animation:spin .6s linear infinite}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .bulb-glass{opacity:.35;transition:.25s}
        .bulb-lit{opacity:1;filter:drop-shadow(0 0 8px #f1c40f) drop-shadow(0 0 18px #f39c12)}
        .targetGlow{opacity:0;pointer-events:none}
        .targetGlow.show{opacity:1;animation:pulse 1s ease-in-out infinite}
        @keyframes pulse{0%{filter:drop-shadow(0 0 0 rgba(255,255,255,0))}50%{filter:drop-shadow(0 0 12px rgba(255,255,255,.9))}100%{filter:drop-shadow(0 0 0 rgba(255,255,255,0))}}
        #wires line{pointer-events:none}
        .step{display:flex;align-items:center;gap:.5rem;margin:.25rem 0}
        .dot{width:12px;height:12px;border-radius:9999px;background:#ddd}
        .step.done .dot{background:#27ae60}
        .step.active .dot{background:#f39c12}
      `}</style>

      <div className="title">Generación de energia</div>

      {/* HUD izquierda */}
      <div className="fixed left-3 top-[70px] w-[300px] bg-white/10 text-white rounded-2xl p-3 backdrop-blur-md">
        <div className={`step ${step1 ? "done" : "active"}`}>
          <span className="dot" /> 1 Encaja <b>ruedas</b>
        </div>
        <div
          className={`step ${
            state.dynamoOnWheel ? "done" : step1 ? "active" : ""
          }`}
        >
          <span className="dot" /> 2) Apoya <b>dínamo</b>
        </div>
        <div className={`step ${step3 ? "done" : step2 ? "active" : ""}`}>
          <span className="dot" /> 3) Conecta <b>cables</b>
        </div>
        <div
          className={`step ${step3 ? (state.pedaling ? "done" : "active") : ""}`}
        >
          <span className="dot" /> 4) <b>Pedalea</b> 
        </div>
        <div className="text-sm opacity-90 mt-2">{hint}</div>
      </div>

      {/* Medidor derecha */}
      <div className="fixed right-3 top-[70px] w-[260px] bg-white/10 text-white rounded-2xl p-3 backdrop-blur-md">
        <div>⚡ Potencia</div>
        <div className="h-4 bg-white/30 rounded-md overflow-hidden">
          <div
            ref={fill}
            className="h-full w-0"
            style={{
              background: "linear-gradient(90deg,#e74c3c,#f39c12,#27ae60)",
              transition: "width .12s",
            }}
          />
        </div>
        <div ref={pct} className="mt-1 font-bold text-right">
          0%
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 top-[90px] bg-white text-gray-800 px-3 py-2 rounded-lg shadow-2xl font-bold max-w-[80vw]">
          {toast}
        </div>
      )}

      {/* ESCENA */}
      <div className="relative w-screen h-[calc(100vh-72px)] grid place-items-center">
        <svg ref={sceneRef} viewBox="0 0 900 520">
          <rect x="0" y="470" width="900" height="50" fill="rgba(0,0,0,.15)" />

          {/* ── MARCO: PNG + ejes objetivos ── */}
          <g id="frame">
            <image
              href={framePng}
              x={FRAME.x}
              y={FRAME.y}
              width={FRAME.w}
              height={FRAME.h}
            />
            <circle
              ref={axleFront}
              id="axleFront"
              cx={FRAME.axleFront.x}
              cy={FRAME.axleFront.y}
              r="10"
              fill="#27ae60"
            />
            <circle
              ref={axleRear}
              id="axleRear"
              cx={FRAME.axleRear.x}
              cy={FRAME.axleRear.y}
              r="10"
              fill="#27ae60"
            />
            <circle
              ref={axleFrontGlow}
              className="targetGlow"
              cx={FRAME.axleFront.x}
              cy={FRAME.axleFront.y}
              r="22"
              fill="none"
              stroke="#fff"
              strokeWidth={4}
            />
            <circle
              ref={axleRearGlow}
              className="targetGlow"
              cx={FRAME.axleRear.x}
              cy={FRAME.axleRear.y}
              r="22"
              fill="none"
              stroke="#fff"
              strokeWidth={4}
            />
          </g>

          {/* ── RUEDA TRASERA ── */}
          <g
            ref={gRear}
            id="wheelRear"
            className="wheel"
            transform={`translate(${START.wheelRear.x},${START.wheelRear.y})`}
          >
            <g ref={rotRear} className="rotor">
              <image
                href={wheelPng}
                x={-WHEEL_R - 5}
                y={-WHEEL_R - 5}
                width={(WHEEL_R + 5) * 2}
                height={(WHEEL_R + 5) * 2}
              />
              {/* contacto para el rodillo */}
              <circle
                ref={rearContact}
                id="rearContact"
                cx={REAR_CONTACT.x}
                cy={REAR_CONTACT.y}
                r="8"
                fill="#27ae60"
              />
              <circle
                ref={rearContactGlow}
                className="targetGlow"
                cx={REAR_CONTACT.x}
                cy={REAR_CONTACT.y}
                r="18"
                fill="none"
                stroke="#fff"
                strokeWidth={4}
              />
            </g>
          </g>

          {/* ── RUEDA DELANTERA ── */}
          <g
            ref={gFront}
            id="wheelFront"
            className="wheel"
            transform={`translate(${START.wheelFront.x},${START.wheelFront.y})`}
          >
            <g ref={rotFront} className="rotor">
              <image
                href={wheelPng}
                x={-WHEEL_R - 5}
                y={-WHEEL_R - 5}
                width={(WHEEL_R + 5) * 2}
                height={(WHEEL_R + 5) * 2}
              />
            </g>
          </g>

          {/* ── DÍNAMO ── */}
          <g
            ref={gDyn}
            id="dynamo"
            className="dynamo"
            transform={`translate(${START.dynamo.x},${START.dynamo.y})`}
          >
            <image href={dynamoPng} x={-DYN.w / 2} y={-DYN.h / 2} width={DYN.w} height={DYN.h} />
            {/* rodillo (derecha) */}
            <circle id="dynRoller" cx={DYN.roller.x} cy={DYN.roller.y} r="10" fill="#7f8c8d" stroke="#95a5a6" strokeWidth={3}/>
            {/* bornes */}
            <circle ref={dynPlus}  id="dynPlus"  cx={DYN.plus.x}  cy={DYN.plus.y}  r="7" fill="#e74c3c" stroke="#fff" strokeWidth={2}/>
            <circle ref={dynMinus} id="dynMinus" cx={DYN.minus.x} cy={DYN.minus.y} r="7" fill="#34495e" stroke="#fff" strokeWidth={2}/>
            <text x={DYN.plus.x - 10}  y={DYN.plus.y - 8}  fill="#fff" fontSize={11} fontWeight={700}>+</text>
            <text x={DYN.minus.x - 10} y={DYN.minus.y - 8} fill="#fff" fontSize={11} fontWeight={700}>–</text>
            <circle ref={dynPlusGlow}  className="targetGlow" cx={DYN.plus.x}  cy={DYN.plus.y}  r="17" fill="none" stroke="#fff" strokeWidth={4}/>
            <circle ref={dynMinusGlow} className="targetGlow" cx={DYN.minus.x} cy={DYN.minus.y} r="17" fill="none" stroke="#fff" strokeWidth={4}/>
          </g>

          {/* ── BOMBILLO (SVG) ── */}
          <g id="bulb" transform="translate(700,180)">
            <defs>
              <radialGradient id="gBulb" cx="50%" cy="35%">
                <stop offset="0%" stopColor="#f1c40f" />
                <stop offset="100%" stopColor="#f39c12" />
              </radialGradient>
            </defs>
            <ellipse ref={bulbGlass} cx="0" cy="0" rx="40" ry="55" fill="url(#gBulb)" className="bulb-glass" />
            <rect x="-18" y="50" width="36" height="26" rx="6" fill="#95a5a6" stroke="#7f8c8d" strokeWidth={3} />
            <circle ref={bulbPlus}  id="bulbPlus"  cx="-12" cy="78" r="8" fill="#e74c3c" stroke="#fff" strokeWidth={2} />
            <circle ref={bulbMinus} id="bulbMinus" cx=" 12" cy="78" r="8" fill="#34495e" stroke="#fff" strokeWidth={2} />
            <text x="-30" y="98" fill="#fff" fontSize={12} fontWeight={700}>+</text>
            <text x="20"  y="98" fill="#fff" fontSize={12} fontWeight={700}>–</text>
            <circle ref={bulbPlusGlow}  className="targetGlow" cx="-12" cy="78" r="18" fill="none" stroke="#fff" strokeWidth={4}/>
            <circle ref={bulbMinusGlow} className="targetGlow" cx=" 12" cy="78" r="18" fill="none" stroke="#fff" strokeWidth={4}/>
          </g>

          {/* ── CABLES ── */}
          <g id="wires">
            {/* ROJO + */}
            <line ref={wirePlus}  x1="102" y1="296" x2="140" y2="296" stroke="#e74c3c" strokeWidth={5} strokeLinecap="round"/>
            <circle ref={leadPlusA} className="lead" cx="102" cy="296" r="10" fill="#e74c3c" stroke="#fff" strokeWidth={2}/>
            <circle ref={leadPlusB} className="lead" cx="140" cy="296" r="10" fill="#e74c3c" stroke="#fff" strokeWidth={2}/>
            {/* NEGRO – */}
            <line ref={wireMinus} x1="160" y1="328" x2="200" y2="328" stroke="#34495e" strokeWidth={5} strokeLinecap="round"/>
            <circle ref={leadMinusA} className="lead" cx="160" cy="328" r="10" fill="#34495e" stroke="#fff" strokeWidth={2}/>
            <circle ref={leadMinusB} className="lead" cx="200" cy="328" r="10" fill="#34495e" stroke="#fff" strokeWidth={2}/>
          </g>
        </svg>
      </div>

      {/* LINK MENÚ (esquina superior izquierda) */}
      <Link to="/" className="absolute top-4 left-4 z-50 px-4 py-3 rounded-xl bg-white/20 text-white font-extrabold text-lg md:text-xl hover:bg-white/30">← Menú</Link>

      {/* CONTROLES */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-3 flex gap-2 bg-white/10 backdrop-blur-md p-2 rounded-xl">
        <button
          className={`px-4 py-2 rounded-lg font-bold text-white ${
            ready ? "bg-emerald-600" : "bg-emerald-600/40 cursor-not-allowed"
          }`}
          onClick={pedalToggle}
          disabled={!ready}
        >
          {state.pedaling ? "⏹️ Parar" : "🚴 Pedalear"}
        </button>
        <button className="px-4 py-2 rounded-lg font-bold text-white bg-rose-600" onClick={reset}>
          🔄 Reiniciar
        </button>
        <button
          className="px-4 py-2 rounded-lg font-bold text-white bg-amber-500"
          onClick={() =>
            show("Encaja ruedas → dínamo → cables → pedalea.")
          }
        >
          📖 Ayuda
        </button>
        <button
          className="px-4 py-2 rounded-lg font-bold text-white bg-sky-600"
          onClick={() => show("Faraday: ε = -dΦ/dt")}
        >
        ➡️ Siguiente
        </button>
      </div>
    </div>
  );
}
