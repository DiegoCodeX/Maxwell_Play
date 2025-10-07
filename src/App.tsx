// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Menu from "@/pages/Menu";
import CargaElectrica from "@/games/carga-electrica";
import GameGaussMagnetico from "@/games/gauss-magnetico";
import CiclaDinamo from "@/games/cicla-dinamo";            // 👈 NUEVO
import ExplicacionVideo from "@/pages/ExplicacionVideo";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-900 text-white">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <a
          href="/"
          className="inline-block mt-6 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
        >
          ← Volver al menú
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />

      {/* Juegos existentes */}
      <Route path="/juegos/carga-electrica" element={<CargaElectrica />} />
      <Route path="/juegos/gauss-magnetico" element={<GameGaussMagnetico />} />

      {/* 👇 NUEVO: Cicla con Dínamo */}
      <Route path="/juegos/cicla-dinamo" element={<CiclaDinamo />} />

      {/* Placeholders que ya tienes */}
      <Route path="/juegos/faraday" element={<Placeholder title="Ley de Faraday – Inducción" />} />
      <Route path="/juegos/ampere-maxwell" element={<Placeholder title="Ley de Ampère–Maxwell" />} />
      <Route path="/juegos/red-wifi" element={<Placeholder title="Red WiFi en Acción" />} />

      <Route path="/explicacion" element={<ExplicacionVideo />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
