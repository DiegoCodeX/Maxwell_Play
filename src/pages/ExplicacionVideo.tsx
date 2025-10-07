// src/pages/ExplicacionVideo.tsx
import { useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { markCompleted } from "@/lib/progress";

export default function ExplicacionVideo() {
  const navigate = useNavigate();
  const ref = useRef<HTMLVideoElement | null>(null);
  type LocState = { src?: string; gameId?: string } | undefined;
  const location = useLocation();
  const state = (location.state as LocState) || {};

  const src = state.src || "/videos/explicacion-carga-electrica.mp4";
  const gameId = state.gameId;

  const goHome = useCallback(() => {
    if (gameId) markCompleted(gameId);
    navigate("/", { replace: true });
  }, [navigate, gameId]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onEnded = () => goHome();
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, [goHome]);

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <button
        onClick={goHome}
        className="absolute top-4 right-4 px-4 py-2 rounded-lg font-bold text-white bg-rose-600 hover:bg-rose-700"
      >
        Volver al menú
      </button>

      <video ref={ref} className="max-w-full max-h-full" controls autoPlay>
        <source src={src} type="video/mp4" />
        Tu navegador no soporta video HTML5.
      </video>
    </div>
  );
}
