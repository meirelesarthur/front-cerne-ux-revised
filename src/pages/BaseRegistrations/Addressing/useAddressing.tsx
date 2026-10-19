// src/pages/BaseRegistrations/Addressing/useAddressing.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de ENDEREÇAMENTO FÍSICO DE ESTOQUE (Addressing).
//
// DESVIO DOCUMENTADO (ver TASK-AD-03a, mesmo padrão de `TASK-CV-04a`):
// `useAddressingTree` usa `useQuery` DIRETO do TanStack Query — NÃO a
// família `useCustomGridQuery*` — porque `GET /addressings/tree` não é
// paginado (Addressing-contrato.md Seção 3, DA-AD-16). A família Grid do
// projeto é desenhada em torno de `paginatedQuery`/`meta.pagination`, que
// este endpoint não tem.
//
// Busca por descrição é filtrada CLIENT-SIDE (ver index.tsx) sobre o array
// já carregado — sem novo request por tecla.
//
// `useAddressingForm` (TASK-AD-03b) segue o padrão real do projeto
// (`useCultivationForm`) — `useCustomFormQueryByGuid`.
//
// `useAddressingParentPreview` (TASK-AD-03b) é um `useQuery` de APOIO à UI
// (não compartilha cache com a listagem) — busca o pai só para EXIBIR
// (descrição + nível) no fluxo de criação contextual ("Adicionar {nível}"),
// ativo só quando `!isEditing && parentUuid`. O pai nunca é escolhido pelo
// usuário (ver "PONTO DE MODELAGEM DE UI" em TASK-AD-03b) — por isso não há
// nenhum equivalente a `useCultivationActiveOptions` aqui.
// -----------------------------------------------------------------------------

import { useQuery } from "@tanstack/react-query";

import type {
  AddressingData,
  AddressingTreeNode,
} from "@/@types/v2/Addressing/addressing";
import { queryKey } from "@/constants/query-key";
import { useCustomFormQueryByGuid } from "@/hooks/useCustomFormQueryByGuid";
import { isValidGuid } from "@/utils/guid";
import {
  getAddressingById,
  getAddressingTree,
} from "@/services/v2/Addressing/addressing-service";

/** Árvore completa dos 4 níveis fixos (Setor→Corredor→Prateleira→Nível) do
 *  tenant ativo (não-paginada). */
export function useAddressingTree() {
  return useQuery({
    queryKey: [queryKey.baseRegistrations.addressing.tree],
    queryFn: async () => {
      const response = await getAddressingTree();
      return (response.data ?? []) as AddressingTreeNode[];
    },
  });
}

interface UseAddressingFormProps {
  registrationId?: string;
  fillForm: (data: AddressingData, resetForce?: boolean) => void;
}

/** Query de detalhe para preencher o formulário de edição (match por GUID) —
 *  mesmo padrão de `useCultivationForm` (Cultivation/useCultivation.tsx). */
export function useAddressingForm({
  registrationId,
  fillForm,
}: UseAddressingFormProps) {
  return useCustomFormQueryByGuid<AddressingData>({
    registrationId,
    queryKey: queryKey.baseRegistrations.addressing.detail,
    asyncFunction: getAddressingById,
    fillForm,
  });
}

/** Leitura pontual de apoio à UI — busca o pai só para EXIBIR (descrição +
 *  nível, informação read-only) no fluxo de criação contextual ("Adicionar
 *  {nível}" de uma linha da árvore, `?parentUuid=`). Ativa só quando NÃO é
 *  edição e há um `parentUuid` na querystring. Sem `queryKey` de cache
 *  compartilhado com a listagem (não precisa invalidação). */
export function useAddressingParentPreview(
  parentUuid: string | undefined,
  isEditing: boolean
) {
  const enabled = !isEditing && isValidGuid(parentUuid);

  return useQuery({
    queryKey: [queryKey.baseRegistrations.addressing.detail, "parent-preview", parentUuid],
    enabled,
    queryFn: async () => {
      if (!parentUuid) throw new Error("parentUuid inválido");
      const response = await getAddressingById(parentUuid);
      return response.data as AddressingData;
    },
  });
}
