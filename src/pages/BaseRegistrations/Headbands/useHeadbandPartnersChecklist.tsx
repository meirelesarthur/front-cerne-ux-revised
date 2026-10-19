// src/pages/BaseRegistrations/Headbands/useHeadbandPartnersChecklist.tsx
// -----------------------------------------------------------------------------
// Hook de query do módulo de TESTEIRAS (Headband) — TASK-HB-FE-05. Mirror
// EXATO de `useOperationsChecklist` (CadastrosBase/Atividades/useActivities.tsx,
// linhas ~67-100) — mesmo padrão já validado em produção para alimentar um
// `CheckboxListField` (lista de checkboxes com busca SERVER-SIDE, sem
// paginação incremental), resolvendo o mesmo problema de UX que motivou o
// precedente: o dropdown flutuante do `SelectAsyncPaginate isMulti` vazava do
// card/overflow em telas menores.
//
// Arquivo NOVO e separado de `useHeadbands.tsx` (desvio deliberado da ficha
// original, que previa editar `useHeadbands.tsx` — TASK-HB-FE-06 está em
// execução CONCORRENTE sobre o mesmo diretório `Headbands/` e por instrução
// direta do task-packet desta rodada, nenhum arquivo já existente em
// `Headbands/` pode ser tocado por este hook; um arquivo novo elimina o
// conflito de edição simultânea sem alterar o comportamento do hook em si).
//
// DOIS CONSUMIDORES no formulário de Testeiras (`CreateOrUpdateHeadband.tsx`,
// TASK-HB-FE-06/07), ambos sobre a MESMA fonte (`listPartners`, `/partners`)
// e a MESMA queryKey base (`queryKey.afiliados.partners` — já cunhada por
// `CadastrosBase/Afiliados/useAfiliados.tsx`, reaproveitada aqui em vez de
// uma chave nova):
//   1. `partner_uuids` (pivot N:N, "Afiliados vinculados") — `CheckboxListField`
//      consome este hook diretamente. Caso de uso previsto pela ficha.
//   2. `partner_uuid` (coluna direta, vínculo ÚNICO, "Afiliado (único)") — SE
//      o formulário seguir o precedente já em produção no próprio módulo
//      (`FilterSideHeadband.tsx`, filtro `partner_uuid`), o campo usa
//      `SelectAsyncPaginate` com `service={listPartners}` DIRETO, sem passar
//      por este hook nem pelo cache do TanStack Query — mecanismo do
//      `react-select-async-paginate`, que gerencia busca/paginação
//      incremental internamente por instância de componente. Não há como
//      esse mecanismo consumir o resultado de um `useQuery` já resolvido
//      (ele PRECISA de uma função assíncrona chamável por keystroke), então
//      as duas UIs não podem compartilhar uma única chamada de rede sob
//      qualquer circunstância — não é duplicação por descuido, é o
//      `SelectAsyncPaginate` sendo, por design, uma segunda via de acesso à
//      mesma fonte. Ver nota de retorno ao Maestro sobre esta divergência.
//
// Quando os dois campos chamam ESTE hook com o mesmo `search` (ex.: ambos em
// `''` no estado inicial), o TanStack Query deduplica automaticamente por
// identidade de queryKey — uma única requisição de rede serve os dois
// observers. A duplicação só reapareceria se um consumidor decidisse NÃO usar
// este hook (caso do `SelectAsyncPaginate` acima).
// -----------------------------------------------------------------------------

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import { listPartners } from '@/services/v2/Afiliados/partner-service';

interface UseHeadbandPartnersChecklistProps {
  search: string;
}

// Alimenta o `CheckboxListField` "Afiliados vinculados" (`partner_uuids`) de
// `CreateOrUpdateHeadband.tsx` — e, se o formulário optar por reaproveitar em
// vez de seguir o precedente do `SelectAsyncPaginate` direto, também o campo
// "Afiliado (único)" (`partner_uuid`). Não usa `useCustomGridQuery` (família
// de GRID paginada) porque este campo não pagina — é uma lista de checkboxes
// com busca, sem página/próxima-página.
//
// `per_page: 100` é o TETO de segurança REAL do backend
// (`PartnerIndexRequest::rules()`, `'per_page' => ['sometimes', 'integer',
// 'min:1', 'max:100']`) — o maior lote permitido em uma única chamada.
// DECISÃO DOCUMENTADA (sem mock): hoje existem só 2 Afiliados reais no banco
// (Headband-contrato.md §2.1), então o teto não é um problema prático agora;
// se o volume real crescer além de 100, o primeiro lote não traz todos — o
// usuário localiza o restante pela busca (`search`, SERVER-SIDE, mesmo
// parâmetro usado pelo `SelectAsyncPaginate`). Paginação incremental do
// checklist (scroll infinito) fica fora do escopo desta rodada; se isso se
// tornar um problema real, é um gap de UX a abrir separadamente (mesma nota
// já registrada no precedente de Atividades).
export function useHeadbandPartnersChecklist({ search }: UseHeadbandPartnersChecklistProps) {
  return useQuery({
    queryKey: [queryKey.afiliados.partners, search],
    queryFn: () => listPartners({ page: 1, per_page: 100, search: search || undefined }),
    staleTime: 30 * 1000,
    // Mantém a lista anterior visível enquanto a busca re-consulta o
    // backend — evita "flash" de lista vazia a cada tecla digitada.
    placeholderData: keepPreviousData,
  });
}
