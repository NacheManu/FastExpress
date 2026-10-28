import { z } from 'zod';

/**
 * Validación de forma de las peticiones (400): campos presentes y con el tipo correcto.
 * Los valores que incumplen una regla de negocio (peso fuera de rango, tipo de cliente
 * o de envío desconocido) los valida el dominio y se responden con 422.
 */
export const shipmentSchema = z.object(
  {
    weightKg: z.number({ error: 'El peso (weightKg) debe ser un número.' }),
    customerType: z.string({ error: 'El tipo de cliente (customerType) es obligatorio y debe ser un texto.' }),
    shippingType: z.string({ error: 'El tipo de envío (shippingType) es obligatorio y debe ser un texto.' }),
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
