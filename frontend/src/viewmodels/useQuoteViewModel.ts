import { useCallback, useEffect, useState } from 'react';
import type { PricingRules, Quote } from '../models/pricing';
import type { CustomerType, Shipment, ShippingType } from '../models/shipment';
import { ApiError } from '../services/httpClient';
import { pricingService as defaultPricingService, type PricingService } from '../services/pricingService';
import { parseWeightInput } from './weightInput';

export interface QuoteForm {
  weight: string;
  customerType: CustomerType;
  shippingType: ShippingType;
}

const INITIAL_FORM: QuoteForm = { weight: '', customerType: 'NUEVO', shippingType: 'ESTANDAR' };

type QuoteOutcome =
  | { type: 'quote'; quote: Quote }
  | { type: 'invalid'; message: string }
  | { type: 'rejected'; message: string }
  | { type: 'error'; message: string };

interface QuoteViewModelOptions {
  pricingService?: PricingService;
  /** Espera tras el último cambio antes de pedir la cotización. */
  debounceMs?: number;
}

const requestKey = (shipment: Shipment, attempt: number) =>
  `${shipment.weightKg}|${shipment.customerType}|${shipment.shippingType}|${attempt}`;

function toOutcome(error: unknown): QuoteOutcome {
  if (error instanceof ApiError) {
    if (error.code === 'WEIGHT_LIMIT_EXCEEDED') {
      return { type: 'rejected', message: error.message };
    }
    if (error.status === 400) {
      return { type: 'invalid', message: error.details[0]?.message ?? error.message };
    }
    return { type: 'error', message: error.message };
  }
  return { type: 'error', message: 'No se pudo calcular la tarifa. Inténtalo de nuevo.' };
}

/**
 * ViewModel del cotizador: mantiene el formulario, pide la tarifa al backend mientras el
 * usuario escribe (con debounce y cancelando peticiones obsoletas) y expone el estado
 * listo para pintar.
 */
export function useQuoteViewModel({
  pricingService = defaultPricingService,
  debounceMs = 350,
}: QuoteViewModelOptions = {}) {
  const [form, setForm] = useState<QuoteForm>(INITIAL_FORM);
  const [rules, setRules] = useState<PricingRules | null>(null);
  const [rulesFailed, setRulesFailed] = useState(false);
  const [result, setResult] = useState<{ key: string; outcome: QuoteOutcome } | null>(null);
  const [attempt, setAttempt] = useState(0);

  const weight = parseWeightInput(form.weight);
  const weightKg = weight.kind === 'valid' ? weight.value : null;
  const { customerType, shippingType } = form;

  useEffect(() => {
    const controller = new AbortController();
    pricingService.getRules(controller.signal).then(
      (loaded) => {
        setRules(loaded);
        setRulesFailed(false);
      },
      () => {
        if (!controller.signal.aborted) {
          setRulesFailed(true);
        }
      },
    );
    return () => controller.abort();
  }, [pricingService]);

  useEffect(() => {
    if (weightKg === null) {
      return;
    }
    const shipment: Shipment = { weightKg, customerType, shippingType };
    const key = requestKey(shipment, attempt);
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      pricingService.quote(shipment, controller.signal).then(
        (quote) => {
          if (!controller.signal.aborted) {
            setResult({ key, outcome: { type: 'quote', quote } });
          }
        },
        (error: unknown) => {
          if (!controller.signal.aborted) {
            setResult({ key, outcome: toOutcome(error) });
          }
        },
      );
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [weightKg, customerType, shippingType, attempt, pricingService, debounceMs]);

  const currentKey = weightKg === null ? null : requestKey({ weightKg, customerType, shippingType }, attempt);
  const current = result && result.key === currentKey ? result.outcome : null;
  const isQuoting = currentKey !== null && current === null;
  const lastQuote = result?.outcome.type === 'quote' ? result.outcome.quote : null;

  const setWeight = useCallback((value: string) => setForm((f) => ({ ...f, weight: value })), []);
  const setCustomerType = useCallback((value: CustomerType) => setForm((f) => ({ ...f, customerType: value })), []);
  const setShippingType = useCallback((value: ShippingType) => setForm((f) => ({ ...f, shippingType: value })), []);
  const reset = useCallback(() => setForm(INITIAL_FORM), []);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    form,
    rules,
    rulesFailed,
    /** Cotización vigente; mientras se recalcula se mantiene la anterior (ver isQuoting). */
    quote: current?.type === 'quote' ? current.quote : isQuoting ? lastQuote : null,
    isQuoting,
    weightError: weight.kind === 'invalid' ? weight.message : current?.type === 'invalid' ? current.message : null,
    rejection: current?.type === 'rejected' ? current.message : null,
    error: current?.type === 'error' ? current.message : null,
    setWeight,
    setCustomerType,
    setShippingType,
    reset,
    retry,
  };
}

export type QuoteViewModel = ReturnType<typeof useQuoteViewModel>;
