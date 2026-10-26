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
