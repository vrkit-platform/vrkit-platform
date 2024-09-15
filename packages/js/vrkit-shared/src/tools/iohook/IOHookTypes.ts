
export type THookEventCommon = {
  mask: number;
  time: number;
};

export type TEventNameKeyboard = 'keypress' | 'keydown' | 'keyup';

export type TEventNameMouse = 'mouseclick' | 'mousedown' | 'mouseup' | 'mousemove' | 'mousedrag';

export type TEventNameWheel = 'mousewheel';

export type THookEventKeyboard = THookEventCommon & {
  type: TEventNameKeyboard;
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  keychar: number;
  keycode: number;
  rawcode: number;
};

export type THookEventMouse = THookEventCommon & {
  type: TEventNameMouse;
  button: number;
  clicks: number;
  x: number;
  y: number;
};

export type THookEventWheel = THookEventCommon & {
  type: TEventNameWheel;
  amount: number;
  clicks: number;
  direction: number;
  rotation: number;
  x: number;
  y: number;
};