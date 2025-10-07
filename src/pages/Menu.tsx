// src/pages/Menu.tsx
import { Link } from "react-router-dom";
import { isCompleted, resetAll } from "@/lib/progress";

type Card = {
  id: number;
  title: string;
  desc: string;
  icon: string;
  formula: string;
  to: string;
  grad: string;
  gameId?: string; // <- opcional para progreso
};

const cards: Card[] = [
  {
    id: 1,
    title: "Ley de Gauss – Campo Eléctrico",
    desc: "Frota globos para cargarlos y acércalos a papelitos.",
    icon: "🎈",
    formula: "∮E⋅dA = Q/ε₀",
    to: "/juegos/carga-electrica",
    grad: "from-orange-400 to-orange-600",
    gameId: "carga-electrica", // <- tendrá chulito al terminar
  },
  {
    id: 2,
    title: "Ley de Gauss – Campo Magnético",
    desc: "Las líneas de B siempre se cierran: no hay monopolos.",
    icon: "🧲",
    formula: "∮B⋅dA = 0",
    to: "/juegos/gauss-magnetico",
    grad: "from-yellow-300 to-pink-400",
    gameId: "gauss-magnetico",
  },
  {
    id: 3,
    title: "Ley de Faraday – Inducción",
    desc: "Explora cómo un campo magnético variable induce corriente.",
    icon: "⚡",
    formula: "ε = −dΦB/dt",
    to: "/juegos/faraday",
    grad: "from-cyan-400 to-blue-600",
    gameId: "faraday",
  },
  {
    id: 4,
    title: "Ley de Ampère–Maxwell",
    desc: "Descubre cómo las corrientes y campos variables generan B.",
    icon: "🔄",
    formula: "∮B⋅dl = μ₀(I + ε₀ dΦE/dt)",
    to: "/juegos/ampere-maxwell",
    grad: "from-green-400 to-emerald-600",
    gameId: "ampere-maxwell",
  },
  {
    id: 5,
    title: "Red WiFi en Acción",
    desc: "Simula cómo viajan las ondas EM en una red WiFi.",
    icon: "📶",
    formula: "v = λ·f",
    to: "/juegos/red-wifi",
    grad: "from-purple-400 to-indigo-600",
    gameId: "red-wifi",
  },
];

export default function Menu() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-700 text-white">
      <header className="relative z-10 text-center py-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold drop-shadow-lg">
          Menú de Juegos Interactivos – Ecuaciones de Maxwell
        </h1>
        <p className="mt-4 text-lg text-white/90">
          Explora los juegos y descubre cómo funcionan las leyes del
          electromagnetismo.
        </p>
        <button
          onClick={() => { resetAll(); location.reload(); }}
          className="mt-4 px-3 py-1 rounded bg-white/20 hover:bg-white/30 font-bold"
          title="Reinicia el progreso de todos los juegos"
        >
          🔁 Reiniciar juegos
        </button>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 pb-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const completed = c.gameId ? isCompleted(c.gameId) : false;
            return (
              <article
                key={c.id}
                className={`group relative rounded-2xl h-64 shadow-xl overflow-hidden transition
                            ${completed ? "opacity-60" : "hover:-translate-y-1 hover:shadow-2xl"}
                            bg-gradient-to-br ${c.grad}`}
              >
                {/* ✅ Sello PASADO */}
                {completed && (
                  <div className="absolute -rotate-12 top-6 left-6 z-10 px-3 py-1 bg-emerald-600 text-white font-extrabold rounded">
                    ✅ Pasado
                  </div>
                )}

                <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/25 backdrop-blur flex items-center justify-center font-extrabold">
                  {c.id}
                </div>

                <div className="absolute inset-0 grid place-items-center text-6xl opacity-30 group-hover:opacity-10 transition">
                  {c.icon}
                </div>

                <div className="absolute top-3 right-4 text-sm opacity-70 font-mono">
                  {c.formula}
                </div>

                <div className="absolute inset-0 p-6 flex flex-col justify-center text-center opacity-0 translate-y-4
                                group-hover:opacity-100 group-hover:translate-y-0 transition">
                  <h3 className="text-lg font-extrabold drop-shadow">{c.title}</h3>
                  <p className="mt-2 text-white/95">{c.desc}</p>

                  <div className="mt-4">
                    {completed ? (
                      <span
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 cursor-not-allowed select-none font-bold"
                        aria-disabled="true"
                        title="Ya completado"
                      >
                        🚫 No disponible
                      </span>
                    ) : (
                      <Link
                        to={c.to}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/25 backdrop-blur hover:bg-white/35 font-bold"
                        aria-label={`Jugar ${c.title}`}
                      >
                        ▶ Play
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
