export const CUSTOMER_TYPES = ['NUEVO', 'FRECUENTE', 'VIP'] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const SHIPPING_TYPES = ['ESTANDAR', 'EXPRESS'] as const;
export type ShippingType = (typeof SHIPPING_TYPES)[number];

export interface Shipment {
  weightKg: number;
  customerType: CustomerType;
  shippingType: ShippingType;
}

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  NUEVO: 'Nuevo',
  FRECUENTE: 'Frecuente',
  VIP: 'VIP',
};

export const SHIPPING_TYPE_LABELS: Record<ShippingType, string> = {
  ESTANDAR: 'Estándar',
  EXPRESS: 'Express',
};

export const CUSTOMER_TYPE_ICONS: Record<CustomerType, string> = {
  NUEVO: 'person_add',
  FRECUENTE: 'loyalty',
  VIP: 'workspace_premium',
};

export const SHIPPING_TYPE_ICONS: Record<ShippingType, string> = {
  ESTANDAR: 'package_2',
  EXPRESS: 'bolt',
};
