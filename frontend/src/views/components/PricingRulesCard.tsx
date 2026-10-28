import { useId, useState, type ReactNode } from 'react';
import { formatCurrency, formatPercent, formatWeight } from '../../core/format';
import { useMediaQuery } from '../../core/hooks/useMediaQuery';
import type { PricingRules } from '../../models/pricing';
import { CUSTOMER_TYPES, CUSTOMER_TYPE_LABELS, SHIPPING_TYPES, SHIPPING_TYPE_LABELS } from '../../models/shipment';
import { cn } from '../../ui/cn';
import { Icon } from '../../ui/Icon';
import { LinearProgress } from '../../ui/LinearProgress';

interface PricingRulesCardProps {
  rules: PricingRules | null;
  failed: boolean;
}

/** Tarifas vigentes (BR-01 a BR-04) según las expone el backend. Desplegable en móvil. */
export function PricingRulesCard({ rules, failed }: PricingRulesCardProps) {
  const isExpandedWindow = useMediaQuery('(min-width: 52.5rem)');
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = userOpen ?? isExpandedWindow;
  const contentId = useId();

  return (
    <section className="rounded-xl bg-surface-container-low">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setUserOpen(!open)}
        className="state-layer flex w-full items-center gap-4 rounded-xl px-5 py-4 text-start focus-visible:outline-3 focus-visible:outline-secondary"
      >
        <Icon name="receipt_long" className="text-on-surface-variant" />
        <span className="min-w-0 flex-1">
          <span className="type-title-medium block">Tarifas vigentes</span>
          <span className="type-body-medium block text-on-surface-variant">Cómo se calcula el precio de un envío</span>
        </span>
        <Icon
          name="expand_more"
          className={cn('text-on-surface-variant transition-transform duration-200 ease-emphasized', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div id={contentId} className="px-5 pb-5">
          {rules ? <RulesContent rules={rules} /> : failed ? <RulesUnavailable /> : <LinearProgress label="Cargando tarifas" />}
        </div>
      )}
    </section>
  );
}

function RulesContent({ rules }: { rules: PricingRules }) {
  const money = (amount: number) => formatCurrency(amount, rules.currency);

  return (
    <>
      <div className="grid gap-3 medium:grid-cols-2">
        <RuleGroup icon="payments" title="Tarifa base">
          <RuleRow label="Por orden" value={money(rules.baseFee)} />
        </RuleGroup>

        <RuleGroup icon="scale" title="Por peso">
          {rules.weightTiers.map((tier) => (
            <RuleRow
              key={tier.minKg}
              label={`${formatWeight(tier.minKg)} – ${formatWeight(tier.maxKg)}`}
              value={`${money(tier.ratePerKg)}/kg`}
            />
          ))}
          <RuleRow
            label={`Más de ${formatWeight(rules.maxWeightKg)}`}
            value={<span className="text-error">No se admite</span>}
          />
        </RuleGroup>

        <RuleGroup icon="loyalty" title="Descuento por cliente">
          {CUSTOMER_TYPES.map((type) => (
            <RuleRow
              key={type}
              label={CUSTOMER_TYPE_LABELS[type]}
              value={formatPercent(rules.customerDiscountPercent[type])}
            />
          ))}
        </RuleGroup>

        <RuleGroup icon="bolt" title="Recargo por envío">
          {SHIPPING_TYPES.map((type) => (
            <RuleRow
              key={type}
              label={SHIPPING_TYPE_LABELS[type]}
              value={`+${formatPercent(rules.shippingSurchargePercent[type])}`}
            />
          ))}
        </RuleGroup>
      </div>
      <p className="type-body-small mt-3 px-1 text-on-surface-variant">
        El descuento se aplica sobre el subtotal (tarifa base + cargo por peso) y el recargo, sobre el subtotal con descuento.
      </p>
    </>
  );
}

function RuleGroup({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-surface-container p-4">
      <h3 className="type-title-small flex items-center gap-2 text-on-surface-variant">
        <Icon name={icon} size={18} />
        {title}
      </h3>
      <dl className="mt-2">{children}</dl>
    </div>
  );
}

function RuleRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="type-body-medium flex justify-between gap-4 py-1">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function RulesUnavailable() {
  return (
    <p className="type-body-medium flex items-center gap-2 text-error">
      <Icon name="error" size={20} />
      No se pudieron cargar las tarifas. Comprueba que el backend esté en ejecución.
    </p>
  );
}
