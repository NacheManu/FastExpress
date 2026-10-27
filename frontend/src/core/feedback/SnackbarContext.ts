import { createContext, useContext } from 'react';

export interface SnackbarMessage {
  message: string;
  action?: { label: string; onClick: () => void };
}

export const SnackbarContext = createContext<((snackbar: SnackbarMessage) => void) | null>(null);

/** Devuelve la función para mostrar un snackbar. */
export function useSnackbar(): (snackbar: SnackbarMessage) => void {
  const show = useContext(SnackbarContext);
  if (!show) {
    throw new Error('useSnackbar debe usarse dentro de <SnackbarProvider>.');
  }
  return show;
}
