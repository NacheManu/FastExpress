import { z } from 'zod';
import { CUSTOMER_TYPES, SHIPPING_TYPES } from '../domain/pricing/shipment.js';

/**
 * Validación de forma de las peticiones. Los límites de peso (BR-02) los valida
 * el dominio para que la regla viva en un solo lugar.
 */
export const shipmentSchema = z.object(
  {
    weightKg: z.number({ error: 'El peso (weightKg) debe ser un número.' }),
    customerType: z.enum(CUSTOMER_TYPES, {
      error: `El tipo de cliente (customerType) debe ser uno de: ${CUSTOMER_TYPES.join(', ')}.`,
    }),
    shippingType: z.enum(SHIPPING_TYPES, {
      error: `El tipo de envío (shippingType) debe ser uno de: ${SHIPPING_TYPES.join(', ')}.`,
    }),
  },
  { error: 'El cuerpo de la petición debe ser un objeto JSON.' },
);

export const createOrderSchema = shipmentSchema.extend({
  customerName: z
    .string({ error: 'El nombre del cliente (customerName) es obligatorio.' })
    .trim()
    .min(1, { error: 'El nombre del cliente no puede estar vacío.' })
    .max(100, { error: 'El nombre del cliente admite como máximo 100 caracteres.' }),
});
