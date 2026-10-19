import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LoadProvider } from '@/contexts/LoadContext';
import { PendencyQueueProvider } from '@/contexts/PendencyQueueContext';
import { TitleProvider } from '@/contexts/TitleContext';
import { UnitProvider } from '@/contexts/UnitContext';
import { AppRoutes } from '@/router';
import { queryClient } from '@/services/query-client';

// function AppContent() {
//   // Validar sessão periodicamente se necessário
//   useEffect(() => {
//     // Adicionar listeners ou validações aqui se necessário
//   }, []);

//   return <AppRoutes />;
// }

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LoadProvider>
        <LanguageProvider>
          <PendencyQueueProvider>
            <AuthProvider>
              <TitleProvider>
                <UnitProvider>
                  <AppRoutes />
                  {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
                </UnitProvider>
              </TitleProvider>
            </AuthProvider>
          </PendencyQueueProvider>
        </LanguageProvider>
      </LoadProvider>
    </QueryClientProvider>
  );
}

export default App;
