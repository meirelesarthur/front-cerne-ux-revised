import React from 'react';

import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider } from '@/contexts/ThemeContext';

import {
  hasAttemptedDynamicImportReload,
  reloadForDynamicImportError,
} from '@/utils/dynamic-import-reload';

import App from './App';

// TASK-063-MAPA-06 (bug #3, F-036) — captura de 1ª linha para "Failed to
// fetch dynamically imported module": o Vite dispara `vite:preloadError` em
// `window` quando um `import()`/`lazy()` nunca antes resolvido nesta sessão
// falha (mirror da recomendação oficial do Vite — "Load error handling").
// Reload automático de 1 única tentativa; se já foi tentado nesta janela de
// sessão, deixa o erro seguir para o `ErrorBoundary`/`ErrorFallbackPage`
// (rede de segunda camada, ver `ErrorFallbackPage.tsx`) em vez de arriscar
// loop.
window.addEventListener('vite:preloadError', (event) => {
  if (hasAttemptedDynamicImportReload()) return;
  event.preventDefault();
  reloadForDynamicImportError();
});

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
