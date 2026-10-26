import { cn } from '../ui/cn';
import { Icon } from '../ui/Icon';

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-12 items-center justify-center rounded-lg bg-primary-container text-on-primary-container',
        className,
      )}
      aria-hidden="true"
    >
      <Icon name="local_shipping" filled />
    </span>
  );
}
