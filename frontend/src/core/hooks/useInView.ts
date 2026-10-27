import { useEffect, useState, type RefObject } from 'react';

/**
 * Indica si el elemento está (al menos en parte) dentro de la ventana.
 * `rootMargin` permite descontar zonas tapadas, como una barra de navegación fija.
 */
export function useInView(ref: RefObject<Element | null>, rootMargin = '0px'): boolean {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? true), {
      rootMargin,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return inView;
}
