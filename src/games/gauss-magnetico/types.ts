export type Emitter = { x: number; y: number; hue: number; key: string };

export type CarData = {
  left: string;
  right: string;
  el: HTMLElement;
};

export type Config = (null | CarData)[];
