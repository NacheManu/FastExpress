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
