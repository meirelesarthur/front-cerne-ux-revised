// src/constants/fiscal/cte/storage.ts
// Chave de storage da Listagem de CT-e (`index.tsx`, TASK-CTE-FE-02), mirror
// `Fiscal/Dfe/storage.ts` — storage key e query key derivam da MESMA
// expressão para nunca divergirem.

import { queryKey } from '@/constants/query-key';

export const CTES_LIST_STORAGE_KEY = 'FiscalCte' + queryKey.ctes.ctesList;
