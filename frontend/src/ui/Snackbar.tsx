import { Icon } from './Icon';

interface SnackbarProps {
  message: string;
  action?: { label: string; onClick: () => void };
  onDismiss: () => void;
}

/**
 * Snackbar de M3. En móvil queda sobre la barra de navegación inferior; a partir de
 * ventanas medianas se centra respecto al contenido (a la derecha del riel).
 */
export function Snackbar({ message, action, onDismiss }: SnackbarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 medium:bottom-6 medium:ps-24">
      <div className="pointer-events-auto flex min-h-12 w-full max-w-xl animate-enter items-center gap-1 rounded-xs bg-inverse-surface py-1 ps-4 pe-1 text-inverse-on-surface shadow-elevation-3">
        <p className="type-body-medium flex-1 py-2">{message}</p>
        {action && (
          <button
            type="button"
            onClick={() => {
              action.onClick();
              onDismiss();
            }}
            className="state-layer h-10 shrink-0 rounded-full px-3 type-label-large text-inverse-primary focus-visible:outline-2 focus-visible:outline-inverse-primary"
          >
            {action.label}
          </button>
        )}
        <button
          type="button"
          aria-label="Cerrar aviso"
          title="Cerrar aviso"
          onClick={onDismiss}
          className="state-layer flex size-10 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-inverse-primary"
        >
          <Icon name="close" size={20} />
        </button>
      </div>
    </div>
  );
}
