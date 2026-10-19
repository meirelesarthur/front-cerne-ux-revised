import { useEffect } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';

import { AppRoutes } from '@/router';

import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorLogProvider } from '@/contexts/ErrorLogContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LoadProvider } from '@/contexts/LoadContext';
import { PendencyQueueProvider } from '@/contexts/PendencyQueueContext';
import { TitleProvider } from '@/contexts/TitleContext';
import { UnitProvider } from '@/contexts/UnitContext';

import { clearDynamicImportReloadFlag } from '@/utils/dynamic-import-reload';

import { queryClient } from '@/services/query-client';

import { ErrorFallbackPage } from './components/ErrorFallbackPage';
import { GlobalSplash } from './components/GlobalSplash';
import ReloadPromptSW from './components/ReloadPromptSW';
import { Toaster } from './components/ui/toaster';

// TASK-063-MAPA-06 — janela de estabilidade após o mount: se não houve outra
// falha de chunk dinâmico neste intervalo, libera uma nova tentativa futura
// de auto-reload (nunca esgota a recuperação para o resto da sessão por
// causa de 1 falha isolada já sanada).
const DYNAMIC_IMPORT_RELOAD_FLAG_RESET_DELAY_MS = 8000;

export function App() {
  useEffect(() => {
    const timer = setTimeout(
      clearDynamicImportReloadFlag,
      DYNAMIC_IMPORT_RELOAD_FLAG_RESET_DELAY_MS
    );
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LoadProvider>
        <LanguageProvider>
          <ErrorLogProvider>
            <PendencyQueueProvider>
              <AuthProvider>
                <TitleProvider>
                  <UnitProvider>
                    {/* Revalidação periódica de sessão/permissões vive no
                        AuthProvider (intervalo + focus) — fase 2 do plano. */}
                    <ErrorBoundary FallbackComponent={ErrorFallbackPage}>
                      <AppRoutes />
                    </ErrorBoundary>
                    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
                    <ReloadPromptSW />
                    <Toaster />
                  </UnitProvider>
                </TitleProvider>
              </AuthProvider>
            </PendencyQueueProvider>
          </ErrorLogProvider>
        </LanguageProvider>
      </LoadProvider>
      {/* Fora do AuthProvider de propósito — ver GlobalSplash.tsx */}
      <GlobalSplash />
    </QueryClientProvider>
  );
}

export default App;
