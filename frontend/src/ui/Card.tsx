import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type CardVariant = 'elevated' | 'filled' | 'outlined';

const variantClasses: Record<CardVariant, string> = {
  elevated: 'bg-surface-container-low shadow-elevation-1',
  filled: 'bg-surface-container-highest',
  outlined: 'border border-outline-variant bg-surface',
};

interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  as?: 'div' | 'section' | 'article' | 'li';
}

export function Card({ variant = 'filled', as: Element = 'div', className, ...props }: CardProps) {
  return <Element className={cn('rounded-lg', variantClasses[variant], className)} {...props} />;
}
