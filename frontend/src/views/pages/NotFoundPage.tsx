import { Link } from 'react-router';
import { buttonClasses } from '../../ui/Button';
import { Icon } from '../../ui/Icon';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <Icon name="explore_off" size={48} className="text-on-surface-variant" />
      <h1 className="type-headline-small">Página no encontrada</h1>
      <p className="type-body-large text-on-surface-variant">La dirección que buscas no existe.</p>
      <Link to="/" className={buttonClasses('tonal', true)}>
        <Icon name="calculate" size={18} />
        Ir al cotizador
      </Link>
    </div>
  );
}
