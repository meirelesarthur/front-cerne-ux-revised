// src/pages/CadastrosBase/Proprietarios/useProprietarios.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo "Proprietários" (Proprietary — Cadastros Base).
//
// TASK-PY-FE-02 cobre a LISTAGEM (`useProprietariesList`, SEM ID pai —
// `useCustomGridQuery`, listagem global escopada só por farm exata via
// header `X-Farm-Id`, DA-PY-04=b — mesmo padrão de `useProviderList`/
// `useContadoresList`).
//
// TASK-PY-FE-03 acrescenta `useProprietaryForm` (`useCustomFormQueryById` —
// detalhe por UUID do PAPEL Proprietary, DA-PY-09, mesmo padrão de
// `useContadorForm`/`useProviderForm`). `fillForm` é um NO-OP proposital
// (`() => {}`): a hidratação do form NÃO acontece via
// `reset()`/`fillForm`/`.replace()` pós-mount — segue a arquitetura
// CORRIGIDA e mais recente do projeto para forms com `useFieldArray`
// (`TASK-PR-FE-10`, `CreateOrUpdateFornecedor.tsx`), que elimina
// estruturalmente os footguns de hidratação tardia (`ERRO-02`/`ERRO-03`):
// `CreateOrUpdateProprietario.tsx` lê `proprietaryQuery.data` diretamente e
// computa `defaultValues` SINCRONAMENTE (`buildProprietaryFormDefaultValues`)
// ANTES do primeiro mount do `useForm`/`useFieldArray`, num componente
// interno gateado (`ProprietaryFormBody`, só monta quando os dados já estão
// prontos). Divergência DELIBERADA do texto original da ficha (que descrevia
// o padrão `fillForm`+`resetForce` genérico, Lei 2) — aplicada por já haver
// precedente real e mais recente no próprio módulo irmão que resolve
// exatamente a classe de bug que o Maestro listou como footguns a evitar.
//
// Achatamento do filtro: `paginatedQuery.filter` guarda o shape
// `ProprietaryFilterForm` (`isEnabled: Option<boolean> | null`, útil para
// re-hidratar o drawer com o `_label` embutido no próprio Option — ver
// `FilterSideProprietarios.tsx`); aqui é achatado para
// `ListProprietariesParams` (valor cru que `listProprietaries`/
// `ProprietaryFilterData` esperam). Armadilha #11 do checklist: `false`
// (Inativo) é valor válido — NUNCA `filter?.isEnabled?.value || undefined`
// (descartaria `false`); usa ternário explícito.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getProprietaryByUuid,
  listProprietaries,
} from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import type { ListProprietariesParams } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  ProprietaryDetail,
  ProprietaryFilterForm,
  ProprietaryListItem,
} from '@/@types/v2/CadastrosBase/proprietary';

interface UseProprietariesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: ProprietaryFilterForm;
}

// Query de listagem paginada de Proprietários (`GET /api/v1/proprietaries`,
// filtros `search`/`is_enabled` 100% server-side).
export function useProprietariesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseProprietariesListProps) {
  return useCustomGridQuery<ProprietaryListItem, ListProprietariesParams>({
    asyncFunction: listProprietaries,
    queryKey: queryKey.cadastrosBase.proprietaries,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: {
      search: filter?.search || undefined,
      // Armadilha #11 do checklist: `false` (Inativo) é valor válido — NUNCA
      // `filter?.isEnabled?.value || undefined` (descartaria `false`).
      is_enabled: filter?.isEnabled ? filter.isEnabled.value : undefined,
    },
  });
}

interface UseProprietaryFormProps {
  registrationId?: string;
}

// Query de detalhe para popular o formulário de criação/edição
// (TASK-PY-FE-03, match por UUID do PAPEL Proprietary — DA-PY-09, NÃO o uuid
// da Person). `fillForm` é NO-OP (ver nota de topo do arquivo) — a
// hidratação real acontece em `CreateOrUpdateProprietario.tsx` via
// `buildProprietaryFormDefaultValues`, computado ANTES do mount.
export function useProprietaryForm({ registrationId }: UseProprietaryFormProps) {
  return useCustomFormQueryById<ProprietaryDetail>({
    registrationId: registrationId ?? '',
    queryKey: queryKey.cadastrosBase.proprietary,
    asyncFunction: getProprietaryByUuid,
    fillForm: () => {},
  });
}
