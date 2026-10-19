/* eslint-disable valid-jsdoc */
/**
 * Setup jsdom para testes de componente (`*.test.tsx`).
 *
 * O jsdom não implementa APIs que o Chakra UI v3 (FloatingPanel/Portal, tokens
 * responsivos) e o drag por ponteiro assumem existir. Sem estes polyfills, o
 * primeiro render do `FloatingPanel` lança e derruba a suíte do painel.
 *
 * Guardado por `typeof window` porque a config roda ambiente `node` por padrão;
 * apenas `*.test.tsx` vai para `jsdom` (ver `environmentMatchGlobs`). Assim o
 * mesmo setup é inócuo nos testes puros de `node`.
 */
if (typeof window !== 'undefined') {
  // Cast único para escrita de globals ausentes no jsdom, evitando o
  // estreitamento de tipo de `in`/atribuição direta em `window`.
  const globalTarget = globalThis as unknown as Record<string, unknown>;
  const win = window as unknown as Record<string, unknown>;

  if (typeof win.matchMedia === 'undefined') {
    win.matchMedia = (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;
  }

  if (typeof win.ResizeObserver === 'undefined') {
    class ResizeObserverMock {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    win.ResizeObserver = ResizeObserverMock;
    globalTarget.ResizeObserver = ResizeObserverMock;
  }

  if (typeof win.IntersectionObserver === 'undefined') {
    class IntersectionObserverMock {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds: ReadonlyArray<number> = [];
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): [] {
        return [];
      }
    }
    win.IntersectionObserver = IntersectionObserverMock;
    globalTarget.IntersectionObserver = IntersectionObserverMock;
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }

  // jsdom não implementa Pointer Capture. O `GridColumnDndList` usa via optional
  // chaining, mas o `FloatingPanelDragTrigger` (zag-js) chama direto.
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = () => {};
    HTMLElement.prototype.releasePointerCapture = () => {};
    HTMLElement.prototype.hasPointerCapture = () => false;
  }
}
