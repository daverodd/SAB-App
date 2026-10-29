import { isCurrentlyRaining } from './sabLogic';

/** Rain status text using the SAB legend ranges (mm accumulated today). */
export function rainStatusText(station: { VALORLECTURA?: any; ACUMULADODIA?: any }): string {
  if (!isCurrentlyRaining(station as any)) return 'Sin lluvia';
  const acc = Number(station.ACUMULADODIA ?? station.VALORLECTURA ?? 0);
  if (acc <= 10) return 'Lluvia leve';
  if (acc <= 30) return 'Lluvia moderada';
  if (acc <= 50) return 'Lluvia fuerte';
  return 'Lluvia muy fuerte';
}
