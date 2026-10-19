// src/pages/CadastrosBase/ContasBancarias/useAccounts.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo "Contas Bancárias" (Account — Cadastros Base /
// Financeiros, execução 025). TASK-FE-564 cobre a LISTAGEM (`useAccountsList`,
// mirror `usePackagesList`/`useCategoryAnimalsList` — `useCustomGridQuery`,
// sem ID de contexto). `useAccountForm` (detalhe por UUID, `useCustomFormQueryByGuid`)
// é reservado para `TASK-FE-565`, NESTE MESMO ARQUIVO (padrão incremental já
// usado em `CentroCusto/useCostCenters.tsx`/`Fornecedores/useProviders.tsx`).
//
// Guard de fazenda ativa (`enabled`, mirror `usePackagesList` — Package foi o
// PRIMEIRO catálogo com listagem, não settings-form, a precisar do guard):
// `accounts` também está atrás de `farm.context` ESTRITO (Account-contrato.md
// §4/D2) — sem fazenda ativa o backend responde 403 cru; a query só dispara
// quando `usePermissions().hasFarm` é `true` (resolvido no `index.tsx`).
//
// Achatamento do filtro: `AccountFilterForm` (TASK-FE-560, `@types/v2/
// CadastrosBase/account`) guarda `type`/`isEnabled` como `Option<T> | null`
// completos (útil para re-hidratar o drawer com o label embutido, ver
// `FilterSideContasBancarias.tsx`); aqui são achatados para
// `ListAccountsParams` (valores crus que `listAccounts`/`AccountIndexRequest`
// esperam — `type` como char cru, `is_enabled` como string 'true'/'false',
// mesma conversão de `useCategoryAnimalsList`).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQueries, useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getAccount, listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import type { ListAccountsParams } from '@/services/v2/CadastrosBase/Account/account-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import type { ProprietaryOption } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listFarms } from '@/services/v2/Farms/farm-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  AccountDetail,
  AccountFilterForm,
  AccountListItem,
} from '@/@types/v2/CadastrosBase/account';
import type { FarmRef } from '@/@types/v2/Farms';

interface UseAccountsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: AccountFilterForm;
  enabled: boolean; // guard hasFarm — ver cabeçalho do arquivo
}

// Query de listagem paginada de Contas Bancárias (`GET /api/v1/accounts`,
// filtros `search`/`type`/`is_enabled` 100% server-side, ordenação FIXA
// `bank asc` — nenhum parâmetro de sort exposto, Account-contrato.md §11).
export function useAccountsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
  enabled,
}: UseAccountsListProps) {
  return useCustomGridQuery<AccountListItem, ListAccountsParams>({
    asyncFunction: listAccounts,
    queryKey: queryKey.cadastrosBase.accounts,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: {
      search: filter?.search?.trim() || undefined,
      // Presença via ternário (não `?.value || undefined`) — mesma
      // disciplina de `useProviderList`/`useCategoryAnimalsList`: `type` é
      // enum char (`C/P/I/L`), nenhum valor é falsy, mas o padrão do módulo
      // financeiro segue o mesmo formato por consistência.
      type: filter?.type ? filter.type.value : undefined,
      // `isEnabled` é `Option<boolean>` — `false` (Inativo) é valor válido,
      // NUNCA `filter?.isEnabled?.value || undefined` (descartaria `false`).
      // Convertido para string 'true'/'false' (contrato do service/backend).
      is_enabled: filter?.isEnabled
        ? (String(filter.isEnabled.value) as 'true' | 'false')
        : undefined,
    },
    enabled,
  });
}

interface UseAccountFormProps {
  registrationId?: string;
  fillForm: (data: AccountDetail, resetForce?: boolean) => void;
  // Guard hasFarm (mirror `usePackageForm`/TASK-FE-522) — `useCustomFormQueryByGuid`
  // (hook compartilhado por ~40 módulos) NÃO aceita um `enabled` externo, só
  // calcula `enabled: isValidGuid(registrationId)` internamente. Resolvido
  // AQUI: quando `enabled` é `false` (sem fazenda ativa), `registrationId`
  // vira `undefined` antes de chegar ao hook — zero chamada de rede sem
  // fazenda ativa (backend é `farm.context` ESTRITO, Account-contrato.md §4/D2).
  enabled: boolean;
}

// Query de detalhe (formulário de criação/edição, `GET /accounts/{uuid}`) —
// mirror `useCostCenterForm`/`usePackageForm`. `fillForm` é guardado por
// `dirtyFields` no chamador (`CreateOrUpdateContaBancaria.tsx`), nunca aqui.
export function useAccountForm({ registrationId, fillForm, enabled }: UseAccountFormProps) {
  return useCustomFormQueryByGuid<AccountDetail>({
    registrationId: enabled ? registrationId : undefined,
    queryKey: queryKey.cadastrosBase.account,
    asyncFunction: getAccount,
    fillForm,
  });
}

// TASK-FE-566 — popula o `CheckboxListField` "Fazendas Vinculadas". Mirror
// EXATO de `Emissores/useIssuers.tsx::useFarmsList` (mesmo `queryKey.farms.list`,
// mesmo `listFarms()` de `services/v2/Farms/farm-service.ts` — `GET
// /farms/current-tenant`, sem paginação real). Reaproveitado tal qual, NÃO
// duplicado como service novo (achado da Tarefa: `listFarms` já existe).
export function useFarmsList() {
  return useQuery<FarmRef[]>({
    queryKey: [queryKey.farms.list],
    queryFn: listFarms,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

// TASK-FE-567 — popula o `CheckboxListField` "Proprietários" (fecha
// GAP-FE-155). Mirror EXATO de `useFarmsList()` acima (mesmo shape de hook,
// `GET /proprietaries/options` — `TASK-BE-568`, sem paginação real, busca
// CLIENT-SIDE feita pelo chamador). Lista vazia/curta é um estado de UI
// honesto (proprietário órfão do pivô `proprietary_tenant`), NÃO um erro —
// tratado pelo chamador via `emptyLabel`, nunca por este hook.
//
// `farmUuid` é ADITIVO (F-348/UT-000446, esteira 067) — quando presente,
// propaga ao service como `farm_uuid` (fiel ao legado: "Proprietário
// Gestor" de Área só lista proprietários da FAZENDA DA ÁREA, não do tenant
// inteiro). Entra na `queryKey` para cachear por fazenda (mirror
// `useCustomFormQueryById`, que inclui o id pai na key) — sem isso, navegar
// entre Áreas de fazendas diferentes na mesma sessão vazaria a lista da
// primeira fazenda consultada. Ausente = comportamento 100% inalterado
// (demais consumidores — Contas Bancárias, Saldo Inicial, OFX, etc. —
// continuam com a MESMA queryKey/query de sempre).
export function useProprietariesList(farmUuid?: string) {
  return useQuery<ProprietaryOption[]>({
    queryKey: [queryKey.cadastrosBase.proprietaryOptions, farmUuid],
    queryFn: () => listProprietaryOptions(undefined, undefined, farmUuid),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

// UT-000723 — opções de "Proprietários" da Conta Bancária = UNIÃO (dedupe por
// uuid) de `GET /proprietaries/options?farm_uuid=<f>` para cada fazenda
// marcada no form (DA-PY-04=b: proprietário é visto por FAZENDA, não por
// tenant). ADITIVO (DEC-008): mesma queryFn/queryKey de
// `useProprietariesList(farmUuid)` (cache compartilhado), sem alterar esse hook.
export function useProprietariesByFarms(farmUuids: string[]) {
  const results = useQueries({
    queries: farmUuids.map((farmUuid) => ({
      queryKey: [queryKey.cadastrosBase.proprietaryOptions, farmUuid],
      queryFn: () => listProprietaryOptions(undefined, undefined, farmUuid),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  });

  const seen = new Set<string>();
  const data: ProprietaryOption[] = [];
  results.forEach((result) => {
    (result.data ?? []).forEach((option) => {
      if (!seen.has(option.uuid)) {
        seen.add(option.uuid);
        data.push(option);
      }
    });
  });

  return {
    data,
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
    refetch: () => Promise.all(results.map((result) => result.refetch())),
  };
}
