import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SegmentedButton } from './SegmentedButton';

const OPTIONS = [
  { value: 'a', label: 'Uno' },
  { value: 'b', label: 'Dos' },
  { value: 'c', label: 'Tres' },
] as const;

function Harness() {
  const [value, setValue] = useState<'a' | 'b' | 'c'>('a');
  return <SegmentedButton label="Opciones" options={OPTIONS} value={value} onChange={setValue} />;
}

describe('SegmentedButton', () => {
  it('marca la opción seleccionada y cambia al pulsar otra', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByRole('radio', { name: 'Uno' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Tres' }));

    expect(screen.getByRole('radio', { name: 'Tres' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Uno' })).not.toBeChecked();
  });

  it('se navega con las flechas del teclado', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('radio', { name: 'Dos' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dos' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}{ArrowLeft}');

    expect(screen.getByRole('radio', { name: 'Tres' })).toBeChecked();
  });
});
