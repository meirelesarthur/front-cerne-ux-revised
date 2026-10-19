// src/pages/CadastrosBase/Batches/useBatches.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de LOTES ANIMAIS (Batch) — REGENERADO do zero
// (TASK-FE-1080/1081), mesmo padrão de `Administrativo/Funcoes/useFunctions.tsx`
// / `CadastrosBase/CategoriasAnimais/useCategoryAnimals.tsx`:
//   - useBatchesList  → useCustomGridQuery (listagem paginada, TASK-FE-1080)
//   - useBatchForm    → useCustomFormQueryByGuid (detalhe p/ formulário, TASK-FE-1081)
//   - useArchiveBatch → useRequest (`typesRequest: 'apply'`, mirror
//     `useGenerateDepreciation` — não há variante "archive" dedicada no hook
//     genérico, `apply` é a opção real usada pelo projeto para ações que não
//     são create/update/delete "puros", ex.: `Depreciacao/useDepreciacao.tsx`)
//
// TASK-FE-1083: `batch-service.ts` foi corrigido na origem (`getBatches`
// devolve `ResponsePagination<BatchData[]>` de verdade, adaptando o envelope
// cru do backend; `getBatchById`/`archiveBatch` devolvem `Response<BatchData>`)
// — os adapters de cast/re-aninhamento que existiam aqui só para contornar o
// tipo/parâmetro errado do service foram REMOVIDOS; os hooks abaixo consomem
// o service direto, mesmo padrão de `useCategoryAnimals.tsx`/`useFunctions.tsx`.
// TASK-FE-1084: `getBatches` aceita `search` no TOPO do objeto de params
// (era `description` — chave que a API ignorava silenciosamente), mesma
// convenção de `listCategoryAnimals`/`listFunctions`.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import {
  archiveBatch,
  getBatchById,
  getBatches,
  listBatchCandidateAnimals,
} from '@/services/v2/Batches/batch-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { BatchCandidateAnimal, BatchData, BatchFilterForm } from '@/@types/v2/Batches';

interface UseBatchesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: BatchFilterForm;
}

// Listagem paginada (contrato v1.1 §3 — status `A`+`P` fixo no backend, sem
// filtro de status na UI; filtro real hoje é só `search`, sobre `description`).
export function useBatchesList({ paginatedQuery, setPaginatedQuery, filter }: UseBatchesListProps) {
  return useCustomGridQuery<BatchData, BatchFilterForm>({
    asyncFunction: getBatches,
    queryKey: queryKey.batches.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as BatchFilterForm),
  });
}

interface UseBatchFormProps {
  registrationId?: string;
  fillForm: (data: BatchData, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID) —
// `categories` vem DERIVADO do backend (contrato v1.1 §3) — o `fillForm` do
// chamador reflete o valor recebido, sem preservar a seleção do create.
export function useBatchForm({ registrationId, fillForm }: UseBatchFormProps) {
  return useCustomFormQueryByGuid<BatchData>({
    registrationId,
    queryKey: queryKey.batches.detail,
    asyncFunction: getBatchById,
    fillForm,
  });
}

interface UseArchiveBatchProps {
  onSuccess: () => void;
}

// Ação "Arquivar" (`POST /animal-batches/{uuid}/archive`, GAP-FE-205) —
// `typesRequest: 'apply'` (mirror `useGenerateDepreciation`, não há variante
// "archive" no hook genérico `useRequest`). Invalida listagem + detalhe.
export function useArchiveBatch({ onSuccess }: UseArchiveBatchProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.batches.batch;

  return useRequest<BatchData>({
    asyncFunction: (uuid: string) => archiveBatch(uuid),
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.archiveConfirm.successToast,
    queryKey: queryKey.batches.list,
    queryKey2: queryKey.batches.detail,
    actionSuccess: onSuccess,
  });
}

interface UseBatchCandidateAnimalsProps {
  /** Categorias atualmente selecionadas no form — 1 card por categoria (TASK-FE-1089). */
  categoryUuids: string[];
  /** SÓ presente em EDIÇÃO — ver nota de correção P0 abaixo. */
  batchUuid?: string;
  /**
   * TASK-FE-1090 — campo "Peso" do form (`parameter_weight_uuid`), MESMO
   * NOME do filtro entregue em `TASK-BE-968`
   * (`CandidateAnimalFilterData`/`AnimalRepository::listCandidates()`).
   * Entra em TODAS as chamadas de candidatos (junto de `category_uuids` e do
   * if/else `without_batch`/`batch_uuid` abaixo) — mirror EXATO do legado
   * (`weightChange()`, `_forms.blade.php:111/119/173`: o mesmo parâmetro
   * `parameter_weight_id` refaz a busca tanto da chamada única de criação
   * quanto das duas chamadas de edição). PRECISA estar na query key (senão o
   * cache do TanStack serve a lista filtrada errada ao trocar o Peso).
   */
  parameterWeightUuid?: string;
}

// TASK-FE-1089 — CORREÇÃO P0 (erro de especificação do handover original):
// `without_batch` e `batch_uuid` são empilhados em AND pelo backend
// (`whereHas('batches', uuid=X)` + `doesntHave('batches')` são mutuamente
// exclusivos) — mandar os DOIS na MESMA chamada devolve conjunto SEMPRE
// VAZIO (confirmado pelo Tester de API). O backend NÃO muda — cada chamada
// isolada continua se comportando exatamente assim, por desenho, fiel ao
// legado (`_forms.blade.php:122-127`, `weightChange()`).
//
// ÚLTIMO AJUSTE (decisão do condutor) — em EDIÇÃO, o card de uma categoria
// já vinculada ao Lote passa a oferecer a UNIÃO de "já vinculados a ESTE
// lote" + "livres" (sem lote nenhum), não só os já vinculados. Duas
// chamadas SEPARADAS (se combinássemos os 2 filtros numa só, seria o mesmo
// AND vazio de sempre), unidas e deduplicadas por `uuid` no cliente:
//   A) `{ category_uuids, batch_uuid }`     → já vinculados A ESTE lote
//   B) `{ category_uuids, without_batch }`  → livres
// Proveniência da decisão: no legado, a ÚNICA rota que junta "livre" +
// "já vinculado" para uma categoria JÁ EXISTENTE no Lote é o render Blade
// inicial (`_card-category.blade.php:16`, `$category->animals` —
// `CategoryAnimal::animals()` é um `hasMany` SEM QUALQUER escopo de
// farm/tenant, `app/CategoryAnimal.php:32` — lista literalmente todos os
// animais da categoria NO SISTEMA INTEIRO, vazamento entre tenants). A
// impossibilidade de oferecer "livre + já vinculado" numa categoria
// pré-existente por uma rota LIMPA é ACIDENTE da mecânica de render do
// legado (a única categoria que combina os dois nunca passa pelo filtro
// `without_batch`/`batch_id` porque é montada direto no HTML no load da
// página) — NÃO é regra de negócio. Mesma natureza do `<select>` que
// truncava vínculos de Centro de Custo (precedente já registrado): a
// intenção (poder escolher entre livres e já vinculados) é replicada; o
// acidente (vazamento sem escopo de tenant) NÃO é. Em CRIAÇÃO nada muda —
// não existe "já vinculado" possível, só a chamada B.
//
// `useQuery` DIRETO (não `useCustomGridQuery`/`useCustomFormQueryByGuid`
// genéricos): o endpoint NÃO pagina (devolve todos os candidatos de uma vez,
// contrato do handover) e o consumo é local (1 fetch — ou 2, em edição —
// por mudança de seleção de Categoria, filtrado/agrupado no client por card
// — nunca paginação reintroduzida aqui). `enabled: categoryUuids.length > 0`
// — sem categoria selecionada não há card nenhum para popular, evita fetch
// vazio/instável.
export function useBatchCandidateAnimals({
  categoryUuids,
  batchUuid,
  parameterWeightUuid,
}: UseBatchCandidateAnimalsProps) {
  const sortedCategoryUuids = [...categoryUuids].sort();

  return useQuery<BatchCandidateAnimal[]>({
    // TASK-FE-1090 — `parameterWeightUuid` NA query key (senão o cache
    // devolveria a lista da faixa de peso anterior ao trocar o Select,
    // mesma contaminação já tratada hoje na árvore de Centros de Custo).
    queryKey: [
      queryKey.batches.candidateAnimals,
      sortedCategoryUuids,
      batchUuid ?? null,
      parameterWeightUuid ?? null,
    ],
    queryFn: async () => {
      if (!batchUuid) {
        // CRIAÇÃO — só `without_batch: true` (só animais ainda livres),
        // 1 única chamada, NUNCA combinada com `batch_uuid` (não existe
        // Lote ainda). `parameter_weight_uuid` entra junto (TASK-FE-1090).
        return listBatchCandidateAnimals({
          category_uuids: sortedCategoryUuids,
          without_batch: true,
          parameter_weight_uuid: parameterWeightUuid,
        });
      }

      // EDIÇÃO — 2 chamadas SEPARADAS (cada uma com só 1 dos 2 filtros,
      // nunca os dois juntos na mesma request), unidas por `uuid` no
      // cliente. `linked` tem prioridade no Map — se por algum motivo o
      // mesmo uuid aparecesse nas 2 respostas (não deveria, são conjuntos
      // mutuamente exclusivos no backend), o dado do lote prevalece.
      // `parameter_weight_uuid` entra nas DUAS chamadas (TASK-FE-1090) — o
      // Task-Packet pede explicitamente que o Peso filtre TODOS os cards,
      // inclusive os já vinculados a este lote (consequência intencional:
      // um animal já vinculado pode sair do universo filtrado ao trocar o
      // Peso — por isso o aviso antes de descartar, na tela).
      const [linked, free] = await Promise.all([
        listBatchCandidateAnimals({
          category_uuids: sortedCategoryUuids,
          batch_uuid: batchUuid,
          parameter_weight_uuid: parameterWeightUuid,
        }),
        listBatchCandidateAnimals({
          category_uuids: sortedCategoryUuids,
          without_batch: true,
          parameter_weight_uuid: parameterWeightUuid,
        }),
      ]);

      const byUuid = new Map<string, BatchCandidateAnimal>();
      linked.forEach((animal) => byUuid.set(animal.uuid, animal));
      free.forEach((animal) => {
        if (!byUuid.has(animal.uuid)) byUuid.set(animal.uuid, animal);
      });

      // Ordenação ESTÁVEL (identificação, uuid como desempate) — a lista
      // não pode "dançar" entre renders só porque a ordem de chegada das 2
      // respostas em paralelo variou.
      return Array.from(byUuid.values()).sort(
        (a, b) => a.identification.localeCompare(b.identification) || a.uuid.localeCompare(b.uuid)
      );
    },
    enabled: sortedCategoryUuids.length > 0,
  });
}
