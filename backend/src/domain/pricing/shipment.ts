import { UnknownCustomerTypeError, UnknownShippingTypeError } from '../errors.js';

export const CUSTOMER_TYPES = ['NUEVO', 'FRECUENTE', 'VIP'] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const SHIPPING_TYPES = ['ESTANDAR', 'EXPRESS'] as const;
export type ShippingType = (typeof SHIPPING_TYPES)[number];

/** Datos de un envío que determinan su tarifa. */
export interface Shipment {
  /** Peso en kilogramos, con un máximo de 2 decimales. */
  weightKg: number;
  customerType: CustomerType;
  shippingType: ShippingType;
}

/** Envío tal como llega del exterior, con los tipos aún sin validar. */
export interface ShipmentInput {
  weightKg: number;
  customerType: string;
  shippingType: string;
}

const isCustomerType = (value: string): value is CustomerType =>
  (CUSTOMER_TYPES as readonly string[]).includes(value);

const isShippingType = (value: string): value is ShippingType =>
  (SHIPPING_TYPES as readonly string[]).includes(value);

/**
 * Comprueba que el tipo de cliente y el de envío sean de los admitidos por BR-03 y BR-04.
 * El peso lo valida el cálculo de la tarifa (BR-02).
 *
 * @throws UnknownCustomerTypeError | UnknownShippingTypeError
 */
export function toShipment({ weightKg, customerType, shippingType }: ShipmentInput): Shipment {
  if (!isCustomerType(customerType)) {
    throw new UnknownCustomerTypeError(customerType, CUSTOMER_TYPES);
  }
  if (!isShippingType(shippingType)) {
    throw new UnknownShippingTypeError(shippingType, SHIPPING_TYPES);
  }
  return { weightKg, customerType, shippingType };
}
