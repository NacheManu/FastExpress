import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';

const variantClasses: Record<IconButtonVariant, string> = {
  standard: 'text-on-surface-variant',
  filled: 'bg-primary text-on-primary disabled:bg-on-surface/12',
  tonal: 'bg-secondary-container text-on-secondary-container disabled:bg-on-surface/12',
  outlined: 'border border-outline-variant text-on-surface-variant',
};

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: string;
  /** Texto accesible; también se muestra como tooltip nativo. */
  label: string;
  variant?: IconButtonVariant;
}

export function IconButton({ icon, label, variant = 'standard', className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'state-layer inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors',
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-secondary',
        'disabled:cursor-not-allowed disabled:text-on-surface/38',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <Icon name={icon} />
    </button>
  );
}
