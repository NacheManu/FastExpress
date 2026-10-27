import { act, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInView } from './useInView';
import { useMediaQuery } from './useMediaQuery';
import { useScrolled } from './useScrolled';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
});

describe('useScrolled', () => {
  it('indica si la página se ha desplazado más allá del umbral', () => {
    const { result } = renderHook(() => useScrolled(50));
    expect(result.current).toBe(false);

    Object.defineProperty(window, 'scrollY', { value: 120, configurable: true });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(true);
  });
});

describe('useMediaQuery', () => {
  it('se actualiza cuando cambia la consulta de medios', () => {
    let matches = false;
    let notify = () => {};
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          get matches() {
            return matches;
          },
          media: query,
          addEventListener: (_type: string, listener: () => void) => {
            notify = listener;
          },
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );

    const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'));
    expect(result.current).toBe(false);

    matches = true;
    act(() => notify());

    expect(result.current).toBe(true);
  });
});

describe('useInView', () => {
  function stubIntersectionObserver() {
    const observer = { observe: vi.fn(), disconnect: vi.fn(), callback: (_entries: unknown[]) => {}, options: {} };
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: unknown[]) => void, options: object) {
          observer.callback = callback;
          observer.options = options;
        }
        observe = observer.observe;
        disconnect = observer.disconnect;
      },
    );
    return observer;
  }

  const ref = { current: document.createElement('div') };

  it('refleja si el elemento es visible y se desconecta al desmontar', () => {
    const observer = stubIntersectionObserver();
    const { result, unmount } = renderHook(() => useInView(ref, '0px 0px -120px 0px'));

    expect(observer.observe).toHaveBeenCalledWith(ref.current);
    expect(observer.options).toEqual({ rootMargin: '0px 0px -120px 0px' });

    act(() => observer.callback([{ isIntersecting: false }]));
    expect(result.current).toBe(false);

    act(() => observer.callback([]));
    expect(result.current).toBe(true);

    unmount();
    expect(observer.disconnect).toHaveBeenCalled();
  });

  it('considera visible el elemento si aún no existe', () => {
    const observer = stubIntersectionObserver();
    const { result } = renderHook(() => useInView({ current: null }));

    expect(result.current).toBe(true);
    expect(observer.observe).not.toHaveBeenCalled();
  });
});

describe('renderizado en servidor', () => {
  it('usa valores seguros cuando no hay ventana (SSR)', () => {
    function Probe() {
      return <p>{`${useMediaQuery('(min-width: 600px)')}|${useScrolled()}`}</p>;
    }

    expect(renderToString(<Probe />)).toBe('<p>false|false</p>');
  });
});
