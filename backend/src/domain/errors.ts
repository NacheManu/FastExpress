/** Error que representa la violación de una regla de negocio. */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** El peso no es un valor válido (no numérico, con más de 2 decimales o por debajo del mínimo). */
export class InvalidWeightError extends DomainError {
  readonly code = 'INVALID_WEIGHT';
}

/** BR-02: el peso supera el máximo admitido y el envío se rechaza. */
export class WeightLimitExceededError extends DomainError {
  readonly code = 'WEIGHT_LIMIT_EXCEEDED';

  constructor(
    readonly weightKg: number,
    readonly maxWeightKg: number,
  ) {
    super(
      `Envío rechazado: el peso (${weightKg} kg) supera el límite permitido de ${maxWeightKg.toFixed(2)} kg.`,
    );
  }
}
