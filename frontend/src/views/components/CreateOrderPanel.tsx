import type { FormEvent } from 'react';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { TextField } from '../../ui/TextField';

interface CreateOrderPanelProps {
  customerName: string;
  nameError: string | null;
  submitError: string | null;
  isSubmitting: boolean;
  /** Mientras se recalcula la tarifa no se permite crear la orden. */
  disabled: boolean;
  onCustomerNameChange: (value: string) => void;
  onSubmit: () => void;
}

export function CreateOrderPanel({
  customerName,
  nameError,
  submitError,
  isSubmitting,
  disabled,
  onCustomerNameChange,
  onSubmit,
}: CreateOrderPanelProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      aria-labelledby="create-order-title"
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl bg-surface-container-low p-5"
    >
      <h3 id="create-order-title" className="type-title-medium">
        Crear orden
      </h3>
      <p className="type-body-medium mt-1 text-on-surface-variant">Registra el envío con la tarifa calculada.</p>

      <TextField
        label="Nombre del cliente"
        leadingIcon="person"
        autoComplete="name"
        maxLength={100}
        value={customerName}
        onChange={(event) => onCustomerNameChange(event.target.value)}
        error={nameError}
        className="mt-4"
      />

      {submitError && (
        <p role="alert" className="type-body-medium mt-3 flex items-center gap-2 text-error">
          <Icon name="error" size={20} />
          {submitError}
        </p>
      )}

      <Button type="submit" icon="add_task" disabled={disabled || isSubmitting} className="mt-4 w-full">
        {isSubmitting ? 'Creando orden…' : 'Crear orden'}
      </Button>
    </form>
  );
}
