import { describe, expect, it } from 'vitest';
import { parseWeightInput } from './weightInput';

describe('parseWeightInput', () => {
  it('trata el campo vacío como "sin datos"', () => {
    expect(parseWeightInput('   ')).toEqual({ kind: 'empty' });
  });

  it.each([
    ['10', 10],
    ['2.5', 2.5],
    ['2,5', 2.5],
    ['5.', 5],
    ['.75', 0.75],
    [' 20.01 ', 20.01],
  ])('interpreta "%s" como %s kg', (raw, value) => {
    expect(parseWeightInput(raw)).toEqual({ kind: 'valid', value });
  });

  it.each(['abc', '-1', '1.2.3', '1e3', '2 kg'])('rechaza "%s"', (raw) => {
    expect(parseWeightInput(raw)).toMatchObject({ kind: 'invalid' });
  });
});

describe('parseWeightInput con los límites de BR-02', () => {
  const LIMITS = { minKg: 0.01, maxKg: 20 };

  it.each([
    ['0.01', 0.01],
    ['5', 5],
    ['5,01', 5.01],
    ['20', 20],
  ])('acepta "%s" dentro del rango', (raw, value) => {
    expect(parseWeightInput(raw, LIMITS)).toEqual({ kind: 'valid', value });
  });

  it.each([
    ['0', 'El peso mínimo es 0.01 kg.'],
    ['0.00', 'El peso mínimo es 0.01 kg.'],
    ['20.01', 'El peso máximo permitido es 20 kg. Reduce el peso e inténtalo de nuevo.'],
    ['2.555', 'El peso admite como máximo 2 decimales.'],
    ['0.001', 'El peso admite como máximo 2 decimales.'],
  ])('rechaza "%s" con el mismo mensaje que el backend', (raw, message) => {
    expect(parseWeightInput(raw, LIMITS)).toEqual({ kind: 'invalid', message });
  });
});
