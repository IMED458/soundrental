export interface ModelProps {
  /** 0 = assembled, 1 = fully exploded. */
  explode: React.MutableRefObject<number>;
  /** Scroll-driven Y rotation, in radians. */
  spin: React.MutableRefObject<number>;
  /** Scroll-driven X tilt, in radians. Optional — the speaker ignores it. */
  tilt?: React.MutableRefObject<number>;
  /** Explode distance multiplier from the admin panel. */
  distance: number;
  scale: number;
  baseRotationY: number;
  /** Site accent colour, used for LEDs and lit details. */
  accent?: string;
}
