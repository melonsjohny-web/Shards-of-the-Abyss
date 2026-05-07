import { createNoise2D } from 'simplex-noise';

// We use a fixed seed or just let it initialize once. 
// For consistency across reloads without a fixed seed, we could pass one, 
// but since this file is evaluated once per page load, it will be consistent.
const noise2D = createNoise2D();

export function getTerrainHeight(x: number, z: number) {
  let h = 
    noise2D(x * 0.005, z * 0.005) * 20 +
    noise2D(x * 0.02, z * 0.02) * 5 +
    noise2D(x * 0.05,  z * 0.05)  * 1;
    
  // Mountain pass (North)
  if (z < -300) {
    h += Math.abs(z + 300) * 0.2;
  }
  // Swamp (South)
  if (z > 300) {
    h = Math.min(h, 2); // flatten out slightly
  }
  
  const distFromCenter = Math.sqrt(x * x + z * z);
  const flatness = Math.min(1, distFromCenter / 50);
  
  return (h * flatness) - 0.5;
}
