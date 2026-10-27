import { useCallback, useState } from 'react';
import type { Order } from '../models/order';
import type { Shipment } from '../models/shipment';
import { ApiError } from '../services/httpClient';
import { orderService as defaultOrderService, type OrderService } from '../services/orderService';

/** ViewModel para registrar una orden a partir de un envío ya cotizado. */
export function useCreateOrderViewModel({ orderService = defaultOrderService }: { orderService?: OrderService } = {}) {
  const [customerName, setCustomerNameState] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const setCustomerName = useCallback((value: string) => {
    setCustomerNameState(value);
    setNameError(null);
  }, []);

  /** Crea la orden; devuelve la orden creada o null si falló (el motivo queda en el estado). */
  const submit = useCallback(
    async (shipment: Shipment): Promise<Order | null> => {
      const name = customerName.trim();
      if (!name) {
        setNameError('Ingresa el nombre del cliente.');
        return null;
      }

      setSubmitting(true);
      setSubmitError(null);
      try {
        const order = await orderService.create({ ...shipment, customerName: name });
        setCustomerNameState('');
        return order;
      } catch (error) {
        const nameIssue =
          error instanceof ApiError ? error.details.find((detail) => detail.field === 'customerName') : undefined;
        if (nameIssue) {
          setNameError(nameIssue.message);
        } else {
          setSubmitError(error instanceof ApiError ? error.message : 'No se pudo crear la orden. Inténtalo de nuevo.');
        }
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [customerName, orderService],
  );

  return { customerName, setCustomerName, nameError, submitError, isSubmitting, submit };
}
