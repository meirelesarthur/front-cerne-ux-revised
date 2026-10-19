// src/pages/Operacional/FindAnimal/index.tsx
// -----------------------------------------------------------------------------
// Tela "Localizar Animal" (Operacional > Pecuária > Manejo, F-042,
// TASK-FA-FE-03/04). SURF-SCREEN-INDEX. NÃO é grid (ADR-FE-01, contrato de
// tela §2.1) — é um localizador (1 campo de busca + 1 dossiê condicional em
// 4 blocos). Casca `<ContainerGrid>` + `<HeaderGrid>` com `<Heading as="h1">`
// — precedente canônico de tela sem tabela (`get_pwa_screen_and_router_pattern`
// §12 Profile / §13 Dashboard).
//
// Estado do animal selecionado vive na URL (`?animal=<uuid>`, `useSearchParams`)
// — NUNCA `localStorage`; preserva deep-link e botão Voltar (contrato §6.1/§6.3).
// O submit do filtro (`FilterFindAnimal.tsx`) só grava o search param — quem
// dispara o dossiê é a MUDANÇA do param, nunca um fetch direto do filtro.
//
// Cinco estados de UI obrigatórios (contrato §6.5, `get_spa_ux_fidelity_pattern`
// §3 — nenhum estado silencioso):
//   1. vazio       — `?animal` ausente → `emptyState.noAnimalSelected`, ZERO request
//   2. carregando  — `dossierQuery.isPending && dossierQuery.isFetching` → Skeleton
//                     no lugar dos painéis; o filtro continua utilizável
//   3. erro        — `dossierQuery.isError` → mensagem + `Tentar novamente`
//                     (`refetch`); 404 tem mensagem própria (`error.notFound`)
//   4. sem permissão — responsabilidade da rota (TASK-FA-FE-06, fora de escopo)
//   5. sucesso      — os 4 painéis do dossiê (TASK-FA-FE-04)
//
// ⚠️ CORREÇÃO (decisão final do dono, run-001, `tp-front-exec-lane-a-06`,
// revertendo o acréscimo de `tp-front-exec-lane-a-05`):
// (1) Botão "Voltar" — REMOVIDO. O padrão canônico de saída do repositório
// (rodapé `Cancelar` do `FormContainer`, `get_pwa_form_query_pattern`) exigiria
// trocar a casca `ContainerGrid`+`HeaderGrid` por `FormContainer` — mudança de
// shell fora do mandato do Executor (já descartada uma vez ao resolver o achado
// do rodapé cortado, item 2 abaixo). O dono decidiu, diante das opções (trocar
// a casca / inventar rodapé não-canônico / ficar sem controle de saída próprio):
// "Deixar sem botão de saída" — mesmo estado do legado
// (`agro365/.../locate-animals/index.blade.php`, sem ação de voltar, só link
// "Saiba mais"). Saída da tela pelo menu ou pelo navegador, sem controle
// dedicado. Slot `header` do `HeaderGrid` removido (ficaria vazio).
//
// (2) Rodapé "comido" — causa raiz: `ContainerGrid` (única casca
// compartilhada, `src/components/ContainerGrid.tsx`) sempre embrulha o
// conteúdo num `PageCard fullHeight` com `overflow:hidden` (altura bounded
// ao viewport) e a própria regra `& > :last-child` do `ContainerGrid` já
// entrega `flex:'0 1 auto'; minHeight:0` a este Box (último filho). Em
// telas de GRID, quem fecha essa conta é o `<Table>`
// (`src/components/Table.tsx`, comentário "Única região de scroll:
// flex:1;minH:0... recorta pelo pai bounded"): o próprio Table abre SEU
// scroll interno (`overflowY="auto"`) dentro da altura que sobra, então o
// `paddingBottom` do `ContainerGrid` sempre aparece intacto abaixo dele.
// Esta tela é um dossiê empilhado (sem tabela) — sem esse scroll interno,
// o conteúdo (filtro + 4 painéis + form de transferência, facilmente mais
// alto que a área disponível) só tinha `overflow: visible` (default) e
// vazava até ser cortado, sem aviso, pelo `overflow: hidden` do `PageCard`
// — o MESMO `paddingBottom` do `ContainerGrid` ficava "atrás" do corte,
// nunca visível (mesmo tipo de causa dos achados 2/3 do dono em
// `FilterFindAnimal.tsx`/`BatchTransferForm.tsx`: um mecanismo de
// distribuição de espaço que só funciona com altura fixa herdada). O
// `overflowY="auto"` abaixo é o MESMO mecanismo do `Table` — não um número
// mágico — e restitui o fechamento de rodapé que o `ContainerGrid` já dá a
// toda tela de grid (mesmo token `paddingBottom`, nenhum valor novo).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Heading, Icon, Skeleton, Text, VStack } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { FiAlertCircle } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';

import { useLanguage } from '@/hooks/useLanguage';
import { useTitle } from '@/hooks/useTitle';

import { AnimalDetailPanel } from './AnimalDetailPanel';
import { BatchLocationPanel } from './BatchLocationPanel';
import { BatchTransferForm } from './BatchTransferForm';
import { FilterFindAnimal } from './FilterFindAnimal';
import { MotherPanel } from './MotherPanel';
import { ReproductivePanel } from './ReproductivePanel';
import { useFindAnimal } from './useFindAnimal';

export default function FindAnimal() {
  const { languageGB } = useLanguage();
  const { updateTitleGB } = useTitle();
  const [searchParams, setSearchParams] = useSearchParams();

  const text = languageGB.livestock.findAnimal;

  // `?animal=<uuid>` ausente → `undefined`, desabilita a query do dossiê
  // dentro de `useFindAnimal` (estado 1 — "vazio").
  const animalUuid = searchParams.get('animal') || undefined;

  // TASK-FA-FE-05 — dívida técnica da Tarefa 02/03 resolvida: o cast
  // `as unknown as UseQueryResult<FindAnimalData>` que vivia AQUI (ponto de
  // CONSUMO) foi movido para dentro de `useFindAnimal.tsx` (ponto de
  // DEFINIÇÃO), única linha, comentário lá explica a origem real do defeito
  // de tipo (hook compartilhado `useCustomFormQueryByGuid`, >100 consumidores,
  // fora do escopo desta fatia). `dossierQuery` já chega aqui com o tipo
  // correto — nenhum cast necessário neste arquivo.
  const { dossier, dossierQuery, transferBatchMutation } = useFindAnimal({ animalUuid });

  useEffect(() => {
    updateTitleGB({ title: text.pageTitle });
    // Regra 2 da Tarefa — só na montagem, mirror do padrão de outras telas
    // que fixam o título uma vez (nenhum consumidor de `titleGB` reage a
    // troca de idioma em runtime hoje).
  }, []);

  function handleFilter(uuid: string) {
    setSearchParams({ animal: uuid });
  }

  // Condição EXATA do contrato §6.5 (TanStack v5): `isPending` sozinho não
  // distingue query DESABILITADA de query CARREGANDO — só `isFetching`
  // junto confirma que há uma request real em andamento.
  const isLoadingDossier = Boolean(animalUuid) && dossierQuery.isPending && dossierQuery.isFetching;
  const isErrorDossier = Boolean(animalUuid) && dossierQuery.isError;
  const hasDossier =
    Boolean(animalUuid) && !isLoadingDossier && !isErrorDossier && Boolean(dossier);

  const isNotFound =
    isErrorDossier &&
    isAxiosError(dossierQuery.error) &&
    dossierQuery.error.response?.status === 404;

  return (
    <ContainerGrid>
      <HeaderGrid>
        <Heading as="h1" fontSize="2xl" fontWeight="bold" color="brandColorText">
          {text.pageTitle}
        </Heading>
      </HeaderGrid>

      <Box mt={6}>
        <FilterFindAnimal onFilter={handleFilter} />
      </Box>

      <Box mt={6} overflowY="auto">
        {/* Estado 1 — vazio (contrato §6.5). */}
        {!animalUuid && (
          <VStack gap={3} py={12} borderTop="1px solid" borderColor="borderGrid">
            <Text color="fg.muted">{text.emptyState.noAnimalSelected}</Text>
          </VStack>
        )}

        {/* Estado 2 — carregando: Skeleton no lugar dos painéis (não dos
            campos individuais — ainda não sabemos a forma do dossiê). */}
        {isLoadingDossier && (
          <VStack align="stretch" gap={4} data-testid="find-animal-loading">
            <Skeleton height="96px" borderRadius="md" />
            <Skeleton height="96px" borderRadius="md" />
            <Skeleton height="96px" borderRadius="md" />
            <Skeleton height="96px" borderRadius="md" />
          </VStack>
        )}

        {/* Estado 3 — erro, com mensagem própria de 404 (contrato §6.5). */}
        {isErrorDossier && (
          <VStack gap={3} py={12} borderTop="1px solid" borderColor="borderGrid">
            <Icon as={FiAlertCircle} boxSize={8} color="red.400" />
            <Text color="fg.muted">{isNotFound ? text.error.notFound : text.error.message}</Text>
            <Button
              variant="outline"
              title={text.error.retry}
              onClick={() => dossierQuery.refetch()}
            />
          </VStack>
        )}

        {/* Estado 5 — sucesso: os 4 painéis do dossiê (TASK-FA-FE-04) + o
            form de transferência (TASK-FA-FE-05, SURF-ACTION-SALVAR-TRANSFER,
            contrato §6.4/regra 1). O bloco de transferência só existe quando
            há dossiê carregado — mirror do legado (`@if (isset())`); a
            permissão `find-animal_edit` (UI apenas) é checada DENTRO do
            próprio `BatchTransferForm` (regra 9). */}
        {hasDossier && dossier && (
          <VStack align="stretch" gap={6}>
            <AnimalDetailPanel animal={dossier.animal} />
            <ReproductivePanel reproductive={dossier.reproductive} />
            <BatchLocationPanel
              batch={dossier.batch}
              grazing={dossier.grazing}
              area={dossier.area}
            />
            <MotherPanel mother={dossier.mother} />
            <BatchTransferForm
              transferBatchMutation={transferBatchMutation}
              currentBatches={dossier.current_batches}
            />
          </VStack>
        )}
      </Box>
    </ContainerGrid>
  );
}
