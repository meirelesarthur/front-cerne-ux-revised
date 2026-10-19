// src/pages/BaseRegistrations/NfseRecebidas/storage.ts
// -----------------------------------------------------------------------------
// Chave de storage da Listagem de NFSe Recebidas (`index.tsx`, TASK-FE-2732),
// extraída para módulo PRÓPRIO (em vez de exportada direto de `index.tsx`)
// para não acoplar o code-splitting de `BuscarDfe.tsx` (TASK-FE-2734, rota
// própria via `lazy()`) ao chunk da Listagem — `BuscarDfe.tsx` só precisa da
// STRING da chave para o handoff de filtro via `localStorage`
// (`usePaginatedQueryStorage` não lê querystring), não do componente inteiro.
// -----------------------------------------------------------------------------

import { queryKey } from '@/constants/query-key';

export const NFSE_RECEBIDAS_STORAGE_KEY =
  'BaseRegistrationsNfseRecebidas' + queryKey.baseRegistrations.nfses;
