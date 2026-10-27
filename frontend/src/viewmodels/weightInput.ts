export type WeightInput =
  | { kind: 'empty' }
  | { kind: 'invalid'; message: string }
  | { kind: 'valid'; value: number };

/**
 * Interpreta lo que el usuario escribe en el campo de peso. Acepta coma o punto decimal.
 * Los límites (mínimo, máximo y decimales) los valida el backend, que es quien aplica BR-02.
 */
export function parseWeightInput(raw: string): WeightInput {
  const normalized = raw.trim().replace(',', '.');
  if (normalized === '') {
    return { kind: 'empty' };
  }
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
    return { kind: 'invalid', message: 'Ingresa un peso válido en kg, por ejemplo 2.5.' };
  }
  return { kind: 'valid', value: Number(normalized) };
}
