// src/pages/CadastrosBase/Clientes/useClientes.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo "Clientes" (Client — Cadastros Base).
//
// ⚠️ SCAFFOLD ADIANTADO POR ESPELHAMENTO (TASK-CL-FE-01/03/02) — escrito
// ANTES de `Client-contrato.md`/backend existirem, mirror estrutural de
// `useProprietarios.tsx` (irmão mais próximo).
//
// `useClientForm` (TASK-CL-FE-03) — `useCustomFormQueryById`, detalhe por
// UUID do PAPEL Client. `fillForm` é um NO-OP proposital (`() => {}`): a
// hidratação do form NÃO acontece via `reset()`/`fillForm`/`.replace()`
// pós-mount — segue a arquitetura gated-mount (mesma decisão de
// `CreateOrUpdateProprietario.tsx`/`CreateOrUpdateFornecedor.tsx`,
// `TASK-PR-FE-10`), que elimina estruturalmente os footguns de hidratação
// tardia do repeater `state_registrations`. `CreateOrUpdateCliente.tsx` lê
// `clientQuery.data` diretamente e computa `defaultValues` SINCRONAMENTE
// (`buildClientFormDefaultValues`) ANTES do primeiro mount do
// `useForm`/`useFieldArray`.
//
// `useClientsList` (TASK-CL-FE-02) — `useCustomGridQuery`, listagem paginada
// server-side (`search`/`is_enabled`). Achatamento do filtro: mesma
// armadilha #11 do checklist já tratada em `useProprietarios.tsx` — `false`
// (Inativo) é valor válido, NUNCA `filter?.isEnabled?.value || undefined`
// (descartaria `false`).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getClientByUuid, listClients } from '@/services/v2/CadastrosBase/Client/client-service';
import type { ListClientsParams } from '@/services/v2/CadastrosBase/Client/client-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  ClientDetail,
  ClientFilterForm,
  ClientListItem,
} from '@/@types/v2/CadastrosBase/client';

interface UseClientsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: ClientFilterForm;
}

// Query de listagem paginada de Clientes (`GET /api/v1/clients`, filtros
// `search`/`is_enabled` 100% server-side).
export function useClientsList({ paginatedQuery, setPaginatedQuery, filter }: UseClientsListProps) {
  return useCustomGridQuery<ClientListItem, ListClientsParams>({
    asyncFunction: listClients,
    queryKey: queryKey.cadastrosBase.clients,
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

interface UseClientFormProps {
  registrationId?: string;
}

// Query de detalhe para popular o formulário de criação/edição (TASK-CL-FE-03,
// match por UUID do PAPEL Client). `fillForm` é NO-OP (ver nota de topo do
// arquivo) — a hidratação real acontece em `CreateOrUpdateCliente.tsx` via
// `buildClientFormDefaultValues`, computado ANTES do mount.
export function useClientForm({ registrationId }: UseClientFormProps) {
  return useCustomFormQueryById<ClientDetail>({
    registrationId: registrationId ?? '',
    queryKey: queryKey.cadastrosBase.client,
    asyncFunction: getClientByUuid,
    fillForm: () => {},
  });
}
