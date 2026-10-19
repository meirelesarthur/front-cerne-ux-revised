// src/pages/Fiscal/Dfe/storage.ts
// -----------------------------------------------------------------------------
// Chave de storage da Listagem de DFe Recebidas (`index.tsx`, TASK-DFE-FE-05),
// extraída para módulo PRÓPRIO (mirror `NfseRecebidas/storage.ts`) para não
// acoplar o code-splitting de `BuscarDfe.tsx` (TASK-DFE-FE-07, rota própria
// via `lazy()`) ao chunk da Listagem inteira — `BuscarDfe.tsx` só precisa da
// STRING da chave para o handoff de filtro via `localStorage`
// (`usePaginatedQueryStorage` não lê querystring), não do componente inteiro.
//
// `queryKey.dfes.dfesList` é o mesmo namespace TOP-LEVEL usado pela query da
// grid (`useCustomGridQuery`) — DEC-007 §12, mirror `Stocks`/`Solicitacao`
// (storage key e query key derivam da MESMA expressão para nunca divergirem).
// -----------------------------------------------------------------------------

import { queryKey } from '@/constants/query-key';

export const DFE_RECEBIDAS_STORAGE_KEY = 'FiscalDfe' + queryKey.dfes.dfesList;
