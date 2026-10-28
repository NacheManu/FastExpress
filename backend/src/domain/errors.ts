/**
 * Error que representa la violación de una regla de negocio con datos bien formados.
 * La API lo responde con 422 e indica el campo y el motivo.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  /** Campo de la petición al que se refiere la regla incumplida. */
  abstract readonly field: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** 0.01 -> "0.01"; 20 -> "20" */
const formatKg = (kg: number) => String(Number(kg.toFixed(2)));

/** El peso no es un valor válido (no finito, con más de 2 decimales o por debajo del mínimo). */
export class InvalidWeightError extends DomainError {
  readonly code = 'INVALID_WEIGHT';
  readonly field = 'weightKg';
}

/** BR-02: el peso supera el máximo admitido y el envío se rechaza. */
export class WeightLimitExceededError extends DomainError {
  readonly code = 'WEIGHT_LIMIT_EXCEEDED';
  readonly field = 'weightKg';

  constructor(
    readonly weightKg: number,
    readonly maxWeightKg: number,
  ) {
    super(`El peso máximo permitido es ${formatKg(maxWeightKg)} kg. Reduce el peso e inténtalo de nuevo.`);
  }
}

/** BR-03: el tipo de cliente no es uno de los admitidos. */
export class UnknownCustomerTypeError extends DomainError {
  readonly code = 'INVALID_CUSTOMER_TYPE';
  readonly field = 'customerType';

  constructor(value: string, allowed: readonly string[]) {
    super(`El tipo de cliente "${value}" no existe. Valores permitidos: ${allowed.join(', ')}.`);
  }
}

/** BR-04: el tipo de envío no es uno de los admitidos. */
export class UnknownShippingTypeError extends DomainError {
  readonly code = 'INVALID_SHIPPING_TYPE';
  readonly field = 'shippingType';

  constructor(value: string, allowed: readonly string[]) {
    super(`El tipo de envío "${value}" no existe. Valores permitidos: ${allowed.join(', ')}.`);
  }
}
