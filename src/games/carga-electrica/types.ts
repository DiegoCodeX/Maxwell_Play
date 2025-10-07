export type XY = { x: number; y: number };

export type Electron = { angle: number; radius: number; speed: number; size: number; x: number; y: number; };

export type Balloon = {
  id: number; color: string; pos: XY; vel: XY; charged: boolean; falling: boolean; rope: number;
  electrons?: Electron[];
};

export type ModalState = { title: string; body: string } | null;
