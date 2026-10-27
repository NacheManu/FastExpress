import type { PricingRules, Quote } from '../models/pricing';
import type { Shipment } from '../models/shipment';
import { http } from './httpClient';

export interface PricingService {
  getRules(signal?: AbortSignal): Promise<PricingRules>;
  quote(shipment: Shipment, signal?: AbortSignal): Promise<Quote>;
}

export const pricingService: PricingService = {
  getRules: (signal) => http.get<PricingRules>('/pricing/rules', signal),
  quote: (shipment, signal) => http.post<Quote>('/pricing/quote', shipment, signal),
};
