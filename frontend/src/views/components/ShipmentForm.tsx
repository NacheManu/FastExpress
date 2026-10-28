import { formatPercent, formatWeight } from '../../core/format';
import type { PricingRules } from '../../models/pricing';
import {
  CUSTOMER_TYPE_ICONS,
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_TYPES,
  SHIPPING_TYPE_ICONS,
  SHIPPING_TYPE_LABELS,
  SHIPPING_TYPES,
  type CustomerType,
  type ShippingType,
} from '../../models/shipment';
import { Button } from '../../ui/Button';
import { SegmentedButton } from '../../ui/SegmentedButton';
import { TextField } from '../../ui/TextField';
import type { QuoteForm } from '../../viewmodels/useQuoteViewModel';

const CUSTOMER_OPTIONS = CUSTOMER_TYPES.map((value) => ({
  value,
  label: CUSTOMER_TYPE_LABELS[value],
  icon: CUSTOMER_TYPE_ICONS[value],
}));

const SHIPPING_OPTIONS = SHIPPING_TYPES.map((value) => ({
  value,
  label: SHIPPING_TYPE_LABELS[value],
  icon: SHIPPING_TYPE_ICONS[value],
}));

interface ShipmentFormProps {
  form: QuoteForm;
  rules: PricingRules | null;
  weightError: string | null;
  onWeightChange: (value: string) => void;
  onCustomerTypeChange: (value: CustomerType) => void;
  onShippingTypeChange: (value: ShippingType) => void;
  onReset: () => void;
}

export function ShipmentForm({
  form,
  rules,
  weightError,
  onWeightChange,
  onCustomerTypeChange,
  onShippingTypeChange,
  onReset,
}: ShipmentFormProps) {
  const discount = rules?.customerDiscountPercent[form.customerType];
  const surcharge = rules?.shippingSurchargePercent[form.shippingType];
  const isDirty = form.weight !== '' || form.customerType !== 'NUEVO' || form.shippingType !== 'ESTANDAR';

  return (
    <section aria-labelledby="shipment-form-title" className="rounded-xl bg-surface-container-low p-5 medium:p-6">
      <div className="flex min-h-10 items-center justify-between gap-2">
        <h2 id="shipment-form-title" className="type-title-large">
          Datos del envío
        </h2>
        {isDirty && (
          <Button variant="text" icon="restart_alt" onClick={onReset}>
            Limpiar
          </Button>
        )}
      </div>

      <form className="mt-4 flex flex-col gap-6" onSubmit={(event) => event.preventDefault()} noValidate>
        <TextField
          label="Peso del paquete"
          leadingIcon="scale"
          suffix="kg"
          inputMode="decimal"
          autoComplete="off"
          value={form.weight}
          onChange={(event) => onWeightChange(event.target.value)}
          error={weightError}
          supportingText={
            rules
              ? `Entre ${formatWeight(rules.minWeightKg)} y ${formatWeight(rules.maxWeightKg)}, con hasta 2 decimales.`
              : 'Peso en kilogramos, con hasta 2 decimales.'
          }
        />

        <div className="flex flex-col gap-2">
          <h3 className="type-title-small text-on-surface-variant">Tipo de cliente</h3>
          <SegmentedButton
            label="Tipo de cliente"
            options={CUSTOMER_OPTIONS}
            value={form.customerType}
            onChange={onCustomerTypeChange}
          />
          {discount !== undefined && (
            <p className="type-body-small px-4 text-on-surface-variant">
              {discount > 0 ? `${formatPercent(discount)} de descuento sobre el subtotal` : 'Sin descuento'}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="type-title-small text-on-surface-variant">Tipo de envío</h3>
          <SegmentedButton
            label="Tipo de envío"
            options={SHIPPING_OPTIONS}
            value={form.shippingType}
            onChange={onShippingTypeChange}
          />
          {surcharge !== undefined && (
            <p className="type-body-small px-4 text-on-surface-variant">
              {surcharge > 0 ? `+${formatPercent(surcharge)} de recargo sobre el subtotal con descuento` : 'Sin recargo'}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
