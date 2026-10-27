import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSnackbar, type SnackbarMessage } from './SnackbarContext';
import { SnackbarProvider } from './SnackbarProvider';

function Trigger({ action }: { action?: SnackbarMessage['action'] }) {
  const show = useSnackbar();
  return <button onClick={() => show({ message: 'Orden creada', action })}>Mostrar</button>;
}

const renderWithProvider = (action?: SnackbarMessage['action']) =>
  render(
    <SnackbarProvider>
      <Trigger action={action} />
    </SnackbarProvider>,
  );

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Snackbar', () => {
  it('muestra el aviso y ejecuta su acción, que también lo cierra', () => {
    const onClick = vi.fn();
    renderWithProvider({ label: 'Ver orden', onClick });

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
    expect(screen.getByRole('status')).toHaveTextContent('Orden creada');

    fireEvent.click(screen.getByRole('button', { name: 'Ver orden' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByText('Orden creada')).not.toBeInTheDocument();
  });

  it('se cierra con el botón de cerrar', () => {
    renderWithProvider();

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));

    expect(screen.queryByText('Orden creada')).not.toBeInTheDocument();
  });

  it('se cierra solo a los 6 segundos', () => {
    vi.useFakeTimers();
    renderWithProvider();

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
    act(() => vi.advanceTimersByTime(5999));
    expect(screen.getByText('Orden creada')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText('Orden creada')).not.toBeInTheDocument();
  });

  it('useSnackbar exige estar dentro de SnackbarProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useSnackbar())).toThrow('useSnackbar debe usarse dentro de <SnackbarProvider>.');
  });
});
