import { BALLOON_W, BALLOON_H } from "./constants";
import type { Balloon, Electron } from "./types";

export function getLocalRect(child: HTMLElement | null, parent: HTMLElement | null) {
  if (!child || !parent) return null;
  const pr = parent.getBoundingClientRect();
  const cr = child.getBoundingClientRect();
  return { x: cr.left - pr.left, y: cr.top - pr.top, w: cr.width, h: cr.height };
}

export function onTopOfTable(b: Balloon, r: { x: number; y: number; w: number; h: number }) {
  const touchTop = Math.abs(b.pos.y + BALLOON_H - r.y) <= 2;
  const overlapX = b.pos.x + BALLOON_W > r.x && b.pos.x < r.x + r.w;
  return touchTop && overlapX;
}

export function makeElectrons(): Electron[] {
  const rx = BALLOON_W * 0.32, ry = BALLOON_H * 0.38;
  const N = 14 + Math.floor(Math.random() * 6);
  return Array.from({ length: N }).map(() => {
    const radius = 0.35 + Math.random() * 0.6;
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.015 + Math.random() * 0.02) * (Math.random() < 0.5 ? 1 : -1);
    const size = 2.6 + Math.random() * 1.8;
    const x = BALLOON_W / 2 + Math.cos(angle) * rx * radius;
    const y = BALLOON_H / 2 + Math.sin(angle) * ry * radius;
    return { angle, radius, speed, size, x, y };
  });
}
