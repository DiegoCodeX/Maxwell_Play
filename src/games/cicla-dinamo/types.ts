export type Vec2 = { x: number; y: number };

export type GameState = {
  wheelsMounted: { front: boolean; rear: boolean };
  dynamoOnWheel: boolean;
  connections: { plus: boolean; minus: boolean };
  pedaling: boolean;
  cadence: number; // 0..1
  power: number;   // 0..100
};
