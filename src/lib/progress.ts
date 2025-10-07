// src/lib/progress.ts
const KEY = "mxw:progress:v1";

// 👉 En desarrollo usamos sessionStorage; en prod, localStorage
const STORAGE: Storage =
  (import.meta as any)?.env?.DEV ? sessionStorage : localStorage;

type Progress = Record<string, boolean>;

function read(): Progress {
  try {
    return JSON.parse(STORAGE.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(p: Progress) {
  STORAGE.setItem(KEY, JSON.stringify(p));
}

export function markCompleted(gameId: string) {
  const p = read();
  p[gameId] = true;
  write(p);
}

export function isCompleted(gameId: string): boolean {
  const p = read();
  return !!p[gameId];
}

// (opcional) para un botón de reset en DEV
export function resetAll() {
  STORAGE.removeItem(KEY);
}
