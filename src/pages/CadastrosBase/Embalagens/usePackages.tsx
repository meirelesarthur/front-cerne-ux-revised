// src/pages/CadastrosBase/Embalagens/usePackages.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de EMBALAGENS (Package) — mesmo padrão de
// Classes/useKinds.tsx (CRUD-por-GUID equivalente):
//   - usePackagesList → useCustomGridQuery (listagem, SEM ID de contexto)
//
// `enabled` é o guard de farm ativa (`usePermissions().hasFarm`, TASK-FE-521)
// — evita disparar o GET quando não há fazenda ativa selecionada (backend é
// `farm.context` ESTRITO, 403 sem X-Farm-Id). Package é o PRIMEIRO catálogo
// COM LISTAGEM (não settings-form) a precisar desse guard — estabelece o
// padrão de listagem para essa classe de Scope (mirror de
// `TenantParameters/useTenantParameters.tsx`, único precedente de `enabled`).
//
// A função de detalhe/form, `usePackageForm`, é adicionada em TASK-FE-522
// neste mesmo arquivo.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getPackageByUuid, listPackages } from '@/services/v2/Packages/package-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { PackageData, PackageFilterForm, PackageListItem } from '@/@types/v2/Packages';

interface UsePackagesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: PackageFilterForm;
  enabled: boolean; // guard hasFarm — ver cabeçalho do arquivo
}

export function usePackagesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
  enabled,
}: UsePackagesListProps) {
  return useCustomGridQuery<PackageListItem, PackageFilterForm>({
    asyncFunction: listPackages,
    queryKey: queryKey.packages.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as PackageFilterForm),
    enabled,
  });
}

interface UsePackageFormProps {
  registrationId?: string;
  fillForm: (data: PackageData, resetForce?: boolean) => void;
  // guard hasFarm (TASK-FE-522) — ver nota abaixo.
  enabled: boolean;
}

// Query de detalhe (formulário de edição) — mesmo guard de fazenda ativa da
// listagem (§3.3 do Contrato). ACHADO: `useCustomFormQueryByGuid` (hook
// compartilhado por ~40 módulos) NÃO aceita um `enabled` externo — só calcula
// `enabled: isValidGuid(registrationId)` internamente. Em vez de estender
// esse hook compartilhado (blast radius desnecessário para este lote),
// o guard é resolvido AQUI: quando `enabled` é `false` (sem fazenda ativa),
// `registrationId` vira `undefined` antes de chegar ao hook — `isValidGuid`
// falha, a query nem dispara. Mesmo efeito de rede (zero chamada sem
// fazenda), sem tocar o hook genérico.
export function usePackageForm({ registrationId, fillForm, enabled }: UsePackageFormProps) {
  return useCustomFormQueryByGuid<PackageData>({
    registrationId: enabled ? registrationId : undefined,
    queryKey: queryKey.packages.detail,
    asyncFunction: getPackageByUuid,
    fillForm,
  });
}
