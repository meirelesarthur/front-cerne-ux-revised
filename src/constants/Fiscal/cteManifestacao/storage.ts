// src/constants/fiscal/cteManifestacao/storage.ts
// Chave de storage da Listagem de Manifestação de CT-e (`index.tsx`,
// TASK-CTE-FE-12), mirror `Fiscal/cte/storage.ts` — storage key e query key
// derivam da MESMA expressão para nunca divergirem.

import { queryKey } from '@/constants/query-key';

export const CTE_MANIFESTACOES_LIST_STORAGE_KEY =
  'FiscalCteManifestacao' + queryKey.cteManifestacoes.cteManifestacoesList;
