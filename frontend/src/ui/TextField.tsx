import { useId, type InputHTMLAttributes } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string;
  leadingIcon?: string;
  /** Texto fijo tras el valor, p. ej. una unidad ("kg"). */
  suffix?: string;
  supportingText?: string;
  error?: string | null;
}

/** Campo de texto relleno (filled) de M3 con etiqueta flotante, texto de apoyo y estado de error. */
export function TextField({
  label,
  leadingIcon,
  suffix,
  supportingText,
  error,
  id,
  className,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const message = error ?? supportingText;
  const messageId = message ? `${inputId}-message` : undefined;

  return (
    <div className={className}>
      <div className="group state-layer relative flex h-14 items-center rounded-t-xs bg-surface-container-highest text-on-surface">
        {leadingIcon && (
          <Icon name={leadingIcon} className={cn('ms-3', error ? 'text-error' : 'text-on-surface-variant')} />
        )}
        <div className="relative h-full min-w-0 flex-1">
          <input
            id={inputId}
            placeholder=" "
            aria-invalid={error ? true : undefined}
            aria-describedby={messageId}
            className={cn(
              'peer h-full w-full bg-transparent pt-5 type-body-large text-on-surface caret-primary outline-none',
              leadingIcon ? 'ps-3' : 'ps-4',
              suffix || error ? 'pe-1' : 'pe-4',
            )}
            {...inputProps}
          />
          <label
            htmlFor={inputId}
            className={cn(
              'pointer-events-none absolute top-2 truncate type-body-small transition-all duration-150 ease-emphasized',
              'peer-placeholder-shown:top-4 peer-placeholder-shown:type-body-large peer-focus:top-2 peer-focus:type-body-small',
              leadingIcon ? 'start-3' : 'start-4',
              error ? 'text-error' : 'text-on-surface-variant peer-focus:text-primary',
            )}
          >
            {label}
          </label>
        </div>
        {suffix && <span className="type-body-large pe-4 pt-5 text-on-surface-variant">{suffix}</span>}
        {error && <Icon name="error" className="me-3 text-error" />}
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-x-0 bottom-0 transition-all duration-150',
            error
              ? 'h-0.5 bg-error'
              : 'h-px bg-on-surface-variant group-focus-within:h-0.5 group-focus-within:bg-primary',
          )}
        />
      </div>
      <div aria-live="polite">
        {message && (
          <p
            id={messageId}
            className={cn('type-body-small px-4 pt-1', error ? 'text-error' : 'text-on-surface-variant')}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
