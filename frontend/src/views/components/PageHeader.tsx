import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 py-4 medium:flex-row medium:items-end medium:justify-between medium:py-6">
      <div className="max-w-2xl">
        <h1 className="type-headline-medium text-on-surface expanded:type-display-small">{title}</h1>
        {description && <p className="type-body-large mt-2 text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}
