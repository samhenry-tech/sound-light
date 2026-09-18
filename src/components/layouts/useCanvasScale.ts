import { useEffect, useState } from 'react';

const CANVAS_W = 1194;
const CANVAS_H = 834;
const MAX_SCALE = 2;

/** Scale factor to fit the fixed 1194×834 iPad canvas into the viewport. */
export const useCanvasScale = (padding: number): number => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const compute = () => {
      const availW = window.innerWidth - padding * 2;
      const availH = window.innerHeight - padding * 2;
      setScale(Math.max(0.3, Math.min(availW / CANVAS_W, availH / CANVAS_H, MAX_SCALE)));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [padding]);

  return scale;
};
