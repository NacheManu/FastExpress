import { formatCurrency } from '../../core/format';
import type { Quote } from '../../models/pricing';
import { Icon } from '../../ui/Icon';

/**
 * Barra flotante para ventanas compactas: muestra el total cuando el resumen queda fuera
 * de la vista y lleva hasta él.
 */
export function QuoteTotalBar({ quote, onShowDetails }: { quote: Quote; onShowDetails: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 animate-enter px-4 pb-3 medium:hidden">
      <button
        type="button"
        onClick={onShowDetails}
        className="state-layer flex h-14 w-full items-center gap-3 rounded-lg bg-inverse-surface ps-4 pe-3 text-inverse-on-surface shadow-elevation-3"
      >
        <span className="type-body-medium">Total</span>
        <span className="type-title-large flex-1 text-start tabular-nums">
          {formatCurrency(quote.breakdown.total, quote.currency)}
        </span>
        <span className="type-label-large flex items-center gap-1 text-inverse-primary">
          Ver desglose
          <Icon name="arrow_downward" size={18} />
        </span>
      </button>
    </div>
  );
}
