// src/hooks/useQueryError.ts
// -----------------------------------------------------------------------------
// Erro único de leitura → toast direto (get_pwa_error_loading_and_notification_
// pattern §10). Diferente do fluxo padrão (interceptor Axios → `ErrorLogPanel`,
// persistente/voltado a debugging), este hook é para a TELA reagir de forma
// visível e pontual a um erro de `GET` — usado pela primeira vez em
// `Fiscal/ArquivosXml` (Tarefa 36, F-133): a consulta agregada de XML precisa
// avisar o usuário quando falha, sem duplicar toast no componente.
//
// NÃO substitui o `ErrorLogPanel` (log técnico persistente) nem o fluxo de
// mutação (`useRequest`/`useDeleted`, que já tem toast próprio). Use apenas
// quando a ausência de dados quebraria a tela silenciosamente.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { toaster } from '@/components/ui/toaster';

import { checkError } from '@/utils/checkError';

export const useQueryError = (queries: Array<{ error?: unknown }>) => {
  const error = queries.find((query) => query?.error)?.error as any;

  useEffect(() => {
    if (!error) return;
    const message = checkError(error?.response?.status, error?.response?.data?.message);
    toaster.error({ description: message });
  }, [error]);
};
