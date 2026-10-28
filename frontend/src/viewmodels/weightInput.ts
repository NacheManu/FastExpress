import { formatWeight } from '../core/format';

export type WeightInput =
  | { kind: 'empty' }
  | { kind: 'invalid'; message: string }
  | { kind: 'valid'; value: number };

export interface WeightLimits {
  minKg: number;
  maxKg: number;
}

/**
 * Interpreta lo que el usuario escribe en el campo de peso (acepta coma o punto decimal)
 * y, si se conocen los límites de BR-02, los valida con los mismos mensajes que el backend.
 * La validación en el cliente solo mejora la experiencia: el backend vuelve a validar siempre.
 */
export function parseWeightInput(raw: string, limits?: WeightLimits): WeightInput {
  const normalized = raw.trim().replace(',', '.');
  if (normalized === '') {
    return { kind: 'empty' };
  }
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
    return { kind: 'invalid', message: 'Ingresa un peso válido en kg, por ejemplo 2.5.' };
  }

  const value = Number(normalized);
  if (!limits) {
    return { kind: 'valid', value };
  }
  if ((normalized.split('.')[1] ?? '').length > 2) {
    return { kind: 'invalid', message: 'El peso admite como máximo 2 decimales.' };
  }
  if (value < limits.minKg) {
    return { kind: 'invalid', message: `El peso mínimo es ${formatWeight(limits.minKg)}.` };
  }
  if (value > limits.maxKg) {
    return {
      kind: 'invalid',
      message: `El peso máximo permitido es ${formatWeight(limits.maxKg)}. Reduce el peso e inténtalo de nuevo.`,
    };
  }
  return { kind: 'valid', value };
}
