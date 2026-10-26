import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';

const variantClasses: Record<ButtonVariant, string> = {
  filled:
    'bg-primary text-on-primary hover:shadow-elevation-1 disabled:bg-on-surface/12 disabled:text-on-surface/38 disabled:shadow-none',
  tonal:
    'bg-secondary-container text-on-secondary-container hover:shadow-elevation-1 disabled:bg-on-surface/12 disabled:text-on-surface/38 disabled:shadow-none',
  outlined: 'border border-outline text-primary disabled:border-on-surface/12 disabled:text-on-surface/38',
  text: 'text-primary disabled:text-on-surface/38',
  elevated:
    'bg-surface-container-low text-primary shadow-elevation-1 hover:shadow-elevation-2 disabled:bg-on-surface/12 disabled:text-on-surface/38 disabled:shadow-none',
};

/** Clases de un botón de M3; útil también para dar estilo de botón a un enlace. */
export function buttonClasses(variant: ButtonVariant = 'filled', withIcon = false): string {
  return cn(
    'state-layer inline-flex h-10 items-center justify-center gap-2 rounded-full type-label-large whitespace-nowrap',
    'transition-shadow duration-200 ease-emphasized disabled:cursor-not-allowed',
    'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-secondary',
    variant === 'text' ? (withIcon ? 'ps-3 pe-4' : 'px-3') : withIcon ? 'ps-4 pe-6' : 'px-6',
    variantClasses[variant],
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: string;
}

export function Button({ variant = 'filled', icon, className, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonClasses(variant, Boolean(icon)), className)} {...props}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}
