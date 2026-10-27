import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Snackbar } from '../../ui/Snackbar';
import { SnackbarContext, type SnackbarMessage } from './SnackbarContext';

const DURATION_MS = 6000;

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<(SnackbarMessage & { id: number }) | null>(null);

  const show = useCallback((snackbar: SnackbarMessage) => {
    setCurrent({ ...snackbar, id: Date.now() });
  }, []);

  const dismiss = useCallback(() => setCurrent(null), []);

  useEffect(() => {
    if (!current) {
      return;
    }
    const timer = window.setTimeout(dismiss, DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [current, dismiss]);

  return (
    <SnackbarContext value={show}>
      {children}
      <div aria-live="polite" role="status">
        {current && (
          <Snackbar
            key={current.id}
            message={current.message}
            action={current.action}
            onDismiss={dismiss}
          />
        )}
      </div>
    </SnackbarContext>
  );
}
