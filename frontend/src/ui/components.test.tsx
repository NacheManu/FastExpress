import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Card } from './Card';
import { Chip } from './Chip';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { NavigationBar, NavigationRail, type NavDestination } from './Navigation';
import { SegmentedButton } from './SegmentedButton';
import { TextField } from './TextField';
import { TopAppBar } from './TopAppBar';

describe('Card', () => {
  it.each([
    ['elevated', 'shadow-elevation-1'],
    ['filled', 'bg-surface-container-highest'],
    ['outlined', 'border-outline-variant'],
  ] as const)('variante %s', (variant, expectedClass) => {
    render(
      <Card variant={variant} as="section" aria-label="tarjeta">
        Contenido
      </Card>,
    );

    const card = screen.getByRole('region', { name: 'tarjeta' });
    expect(card.tagName).toBe('SECTION');
    expect(card).toHaveClass('rounded-lg', expectedClass);
  });

  it('usa un div con la variante filled por defecto', () => {
    render(<Card data-testid="card" />);

    expect(screen.getByTestId('card').tagName).toBe('DIV');
    expect(screen.getByTestId('card')).toHaveClass('bg-surface-container-highest');
  });
});

describe('IconButton', () => {
  it.each([
    ['standard', 'text-on-surface-variant'],
    ['filled', 'bg-primary'],
    ['tonal', 'bg-secondary-container'],
    ['outlined', 'border-outline-variant'],
  ] as const)('variante %s: accesible por su etiqueta y pulsable', (variant, expectedClass) => {
    const onClick = vi.fn();
    render(<IconButton icon="close" label="Cerrar" variant={variant} onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'Cerrar' });
    fireEvent.click(button);

    expect(button).toHaveClass(expectedClass);
    expect(button).toHaveAttribute('title', 'Cerrar');
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('Button, Chip e Icon', () => {
  it('el botón de texto ajusta el relleno según lleve icono o no', () => {
    render(
      <>
        <Button variant="text">Sin icono</Button>
        <Button variant="text" icon="add">
          Con icono
        </Button>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Sin icono' })).toHaveClass('px-3');
    expect(screen.getByRole('button', { name: /Con icono/ })).toHaveClass('ps-3', 'pe-4');
  });

  it('el chip sin icono usa relleno simétrico', () => {
    render(<Chip label="10 kg" />);

    expect(screen.getByText('10 kg')).toHaveClass('px-3');
  });

  it('el icono relleno activa el eje FILL de Material Symbols', () => {
    render(<Icon name="star" filled size={56} />);

    expect(screen.getByText('star').style.fontVariationSettings).toBe("'FILL' 1, 'opsz' 48");
  });
});

describe('TextField', () => {
  it('sin icono, sufijo ni mensajes', () => {
    render(<TextField label="Nombre" />);

    const input = screen.getByLabelText('Nombre');
    expect(input).toHaveClass('ps-4', 'pe-4');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('con error: lo anuncia y lo asocia al campo', () => {
    render(<TextField label="Nombre" error="Obligatorio" supportingText="Ayuda" />);

    const input = screen.getByLabelText('Nombre');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Obligatorio');
    expect(screen.getByText('Obligatorio').closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
    expect(screen.queryByText('Ayuda')).not.toBeInTheDocument();
  });
});

describe('SegmentedButton', () => {
  it('ignora las teclas que no son flechas', () => {
    function Harness() {
      const [value, setValue] = useState<'a' | 'b'>('a');
      return (
        <SegmentedButton
          label="Opciones"
          value={value}
          onChange={setValue}
          options={[
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ]}
        />
      );
    }
    render(<Harness />);

    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'Enter' });

    expect(screen.getByRole('radio', { name: 'A' })).toBeChecked();
  });
});

describe('Navegación', () => {
  const DESTINATIONS: NavDestination[] = [
    { to: '/', label: 'Cotizar', icon: 'calculate', end: true },
    { to: '/ordenes', label: 'Órdenes', icon: 'inventory_2' },
  ];

  it.each([
    ['riel', NavigationRail],
    ['barra', NavigationBar],
  ])('el %s marca el destino activo', (_name, Navigation) => {
    render(
      <MemoryRouter initialEntries={['/ordenes']}>
        <Navigation destinations={DESTINATIONS} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /Órdenes/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Cotizar/ })).not.toHaveAttribute('aria-current');
  });

  it('el riel muestra su cabecera', () => {
    render(
      <MemoryRouter>
        <NavigationRail destinations={DESTINATIONS} header={<span>Marca</span>} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Marca')).toBeInTheDocument();
  });
});

describe('TopAppBar', () => {
  afterEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  it('cambia de color al desplazar el contenido', () => {
    render(<TopAppBar title="FastExpress" leading={<span>logo</span>} actions={<button>acción</button>} />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-surface');

    Object.defineProperty(window, 'scrollY', { value: 40, configurable: true });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(header).toHaveClass('bg-surface-container');
  });

  it('funciona sin icono inicial ni acciones', () => {
    render(<TopAppBar title="Solo título" />);

    expect(screen.getByRole('banner')).toHaveTextContent('Solo título');
  });
});
