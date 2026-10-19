// src/constants/Fiscal/accountingEntry/default-values.ts
// `defaultValues` do `useForm<AccountingEntryForm>` de Partida Dobrada
// (AccountingEntry — domínio Fiscal, F-128, esteira 97-Esteiras/068,
// TASK-PD-FE-07). Nasce com 1 linha vazia em `items` (mirror
// `MovementForm`/TASK-MV-FE-05 Ajuste 1, `CreateOrUpdateMovimento.tsx`) —
// evita o clique obrigatório em "Adicionar item" antes de começar a
// preencher no modo CRIAR. Em modo EDITAR, `fillAccountingEntryForm`
// sobrescreve este default via `reset()` com as linhas reais do servidor
// (nunca soma/concatena com este default, Lei 2 do `get_pwa_form_query_pattern`).
//
// ⚠️ Pasta pelo NOME DO MÓDULO real já em uso neste projeto
// (`src/constants/Fiscal/accountingEntry/`, capitalizado — mirror
// `accounting-entry-schema.ts`/`accounting-entry-service.ts`), não o path
// em minúsculas citado na ficha da Tarefa — fonte de verdade real do
// repositório > texto da ficha.

import type { AccountingEntryForm } from '@/@types/v2/Fiscal/accountingEntry';

export const accountingEntryFormDefaultValues: AccountingEntryForm = {
  date: null,
  description: '',
  origin: null,
  items: [{ plan_account_uuid: null, condition: null, value: null }],
};
