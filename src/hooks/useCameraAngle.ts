import { useEffect, useState } from 'react';

export function useCameraAngle() {
  const [angle, setAngle] = useState(0);
  
  useEffect(() => {
    let id: number;
    const update = () => {
      const a = (window as any).__cameraAngle || 0;
      setAngle(a);
      id = requestAnimationFrame(update);
    };
    id = requestAnimationFrame(update);
    return () => cancelAnimationFrame(id);
  }, []);
  
  return angle;
}
