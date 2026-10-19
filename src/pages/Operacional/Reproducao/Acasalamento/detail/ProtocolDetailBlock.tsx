// src/pages/Operacional/Reproducao/Acasalamento/detail/ProtocolDetailBlock.tsx
// -----------------------------------------------------------------------------
// Bloco `bm-tab-protocol` (nomenclatura herdada do escopo selado — NÃO é uma
// aba, ver ADR-FE-BM-01/GAP-FE-BM-02) da visualização de Acasalamento
// (BreedingMating, F-016, 97-Esteiras/001, TASK-BM-FE-06, contrato de tela
// §6.4). Renderizado pelo pai (`AcasalamentoDetalhe.tsx`) SÓ quando
// `data.protocol !== null`.
//
// Conteúdo: linhas por animal (mirror `sections/ProtocolRow.tsx` da
// TASK-BM-FE-05 em modo LEITURA, rótulos reusados de `form.sections.protocol.*`),
// AGRUPADAS/rotuladas por etapa (`protocol_identification`, `GAP-FE-BM-18`/
// `TASK-BM-FE-23`), + a TIMELINE RICA (`data.timeline`, EP-BM-02): nome do
// protocolo, serviço(s), produto(s)+quantidade, data/dia da semana/horário e
// o intervalo entre etapas — tudo já pronto do servidor (mirror
// `BreedingMatingTimelineResource`/`BreedingMatingProtocolLineResource`/
// `BreedingMatingResource::buildProtocolBlock()`). **Nenhum cálculo de
// data/dia da semana/intervalo no front** (regra 5 da Tarefa original,
// regra 2 da `TASK-BM-FE-23`, contrato de tela §6.4) — todo campo é exibido
// tal como o servidor entrega, só com máscara de exibição (`formatDate`, já
// usada em outras telas do módulo) sobre `date`.
//
// "Tintas" só aparece quando `breedingMatingType === 2` (IATF), nunca em FIV
// (CLM-016, mirror `ProtocolRow.tsx`). "Sêmen"/"Embrião" é rótulo dinâmico
// pelo mesmo campo (`semen_or_embryo`), também mirror `ProtocolRow.tsx`.
//
// Linguagem visual da timeline: nó circular + conector entre etapas, ADAPTADA
// (não importada) de `WorkflowTimeline.tsx` do design system `cerne` — o
// componente original só aceita 1 `label` + 1 `description` (string) por
// etapa, insuficiente para o corpo estruturado exigido aqui (serviço(s) +
// produto(s)/quantidade + data + dia da semana + horário + intervalo);
// reconstruído em Chakra v3 puro (`Box`/`Flex`), mesma stack já usada neste
// arquivo (`GAP-FE-BM-18`, "Decisão de layout").
// -----------------------------------------------------------------------------

import { Fragment } from 'react';

import { Box, Flex, Heading, Table, Text } from '@chakra-ui/react';

import formatDate from '@/utils/formatDate';

import type { LanguageDate } from '@/@types/language';
import type {
  BreedingMatingProtocolAnimalLine,
  BreedingMatingProtocolDetail,
  BreedingMatingProtocolTimelineStep,
  BreedingMatingTypeValue,
} from '@/@types/v2/BreedingMating';

export interface ProtocolDetailBlockProps {
  protocol: BreedingMatingProtocolDetail;
  breedingMatingType: BreedingMatingTypeValue;
  languageGB: LanguageDate;
}

/**
 * Linhas de animal pareadas com um marcador de "esta linha inicia um novo
 * grupo de etapa" — a sequência de `protocol.animals` já vem ordenada do
 * servidor (nunca reordenada/agrupada via `reduce` aqui), só detectamos a
 * transição sequencial de `protocol_identification` (Roteiro do Gap,
 * Passo 3.1).
 *
 * @param {BreedingMatingProtocolAnimalLine[]} animals - Linhas de animal do bloco `protocol`, já
 * ordenadas pelo servidor.
 * @return {Array} Cada linha original + `isNewStage` (`{row, isNewStage}`, true quando esta
 * linha inicia uma nova etapa).
 */
function withStageGroupMarker(
  animals: BreedingMatingProtocolAnimalLine[]
): Array<{ row: BreedingMatingProtocolAnimalLine; isNewStage: boolean }> {
  return animals.map((row, index) => ({
    row,
    isNewStage:
      index === 0 || row.protocol_identification !== animals[index - 1].protocol_identification,
  }));
}

/**
 * Produto/quantidade pareados por índice, descartando slots sem produto
 * (`quantities[i] === ''`, sentinela de ausência — nunca exibida como `0`,
 * Regra 4 da `TASK-BM-FE-23`). `measurement` NÃO entra aqui — é campo
 * singular por etapa (Regra 3), exibido uma única vez pelo chamador.
 *
 * @param {BreedingMatingProtocolTimelineStep} step - Uma etapa da timeline (`protocol.timeline[i]`).
 * @return {Array} Pares produto/quantidade (`{product, quantity}`) com slots vazios já
 * descartados.
 */
function pairedProducts(step: BreedingMatingProtocolTimelineStep): Array<{
  product: string;
  quantity: number | string;
}> {
  return step.products
    .map((product, index) => ({ product, quantity: step.quantities[index] }))
    .filter((pair) => pair.quantity !== '');
}

/**
 * Serviços reais da etapa, descartando slots sem serviço (`services[i] === ''`,
 * mesma sentinela de ausência de `quantities`, array paralelo à mesma linha
 * crua de `protocol_season_products` — `GAP-FE-BM-19`). Sem este filtro,
 * `join(', ')` produz vírgula solta/rótulo vazio quando o array tem ≥2
 * entradas e ao menos uma é `''` (a maioria dos nós reais amostrados).
 *
 * @param {BreedingMatingProtocolTimelineStep} step - Uma etapa da timeline (`protocol.timeline[i]`).
 * @return {string[]} Rótulos de serviço reais, sem entradas vazias.
 */
function realServices(step: BreedingMatingProtocolTimelineStep): string[] {
  return step.services.filter((service) => service !== '');
}

export function ProtocolDetailBlock({
  protocol,
  breedingMatingType,
  languageGB,
}: ProtocolDetailBlockProps) {
  const text = languageGB.breedingMatings.breedingMating;
  const sectionText = text.form.sections.protocol;
  const detailText = text.detail;
  const timelineText = detailText.protocol;

  const isIatf = breedingMatingType === 2;
  const isFiv = breedingMatingType === 3;
  const semenOrEmbryoLabel = isFiv ? sectionText.embryo : sectionText.semen;

  /** Total de colunas hoje existentes na tabela de animais — base do
   *  `colSpan` da linha de subcabeçalho de etapa (mirror `Table.Cell
   *  colSpan`, `DetalheEquipamento.tsx:541`). */
  const animalColumnCount = isIatf ? 9 : 8;

  const groupedAnimals = withStageGroupMarker(protocol.animals);

  return (
    <Box
      mt={6}
      bg="bg.muted"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      p={4}
    >
      <Heading as="h3" size="sm" fontWeight="semibold" color="fg.default" mb={3}>
        {text.detail.sections.protocol}
      </Heading>

      {protocol.animals.length === 0 ? (
        <Text fontSize="sm" color="fg.muted" py={2}>
          {detailText.emptySection}
        </Text>
      ) : (
        <Box overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{sectionText.animal}</Table.ColumnHeader>
                <Table.ColumnHeader>{sectionText.time}</Table.ColumnHeader>
                <Table.ColumnHeader>{sectionText.bodyScore}</Table.ColumnHeader>
                {isIatf && <Table.ColumnHeader>{sectionText.ink}</Table.ColumnHeader>}
                <Table.ColumnHeader>{sectionText.eligible}</Table.ColumnHeader>
                <Table.ColumnHeader>{sectionText.responsible}</Table.ColumnHeader>
                <Table.ColumnHeader>{sectionText.products}</Table.ColumnHeader>
                <Table.ColumnHeader>{semenOrEmbryoLabel}</Table.ColumnHeader>
                <Table.ColumnHeader>{sectionText.batchTransfer}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {groupedAnimals.map(({ row, isNewStage }, index) => (
                <Fragment key={row.uuid ?? `${row.animal.uuid}-${index}`}>
                  {isNewStage && (
                    <Table.Row
                      key={`stage-${row.protocol_identification}-${index}`}
                      bg="bg.emphasized"
                    >
                      <Table.Cell
                        colSpan={animalColumnCount}
                        fontWeight="semibold"
                        color="fg.default"
                        fontSize="xs"
                        textTransform="uppercase"
                      >
                        {`${timelineText.timelineIdentification}: ${row.protocol_identification}`}
                      </Table.Cell>
                    </Table.Row>
                  )}
                  <Table.Row>
                    <Table.Cell>{row.animal.code}</Table.Cell>
                    <Table.Cell>{row.time ?? '—'}</Table.Cell>
                    <Table.Cell>{row.body_score?.label ?? '—'}</Table.Cell>
                    {isIatf && (
                      <Table.Cell>
                        {row.ink === 'S'
                          ? text.options.ink.yes
                          : row.ink === 'P'
                            ? text.options.ink.little
                            : row.ink === 'N'
                              ? text.options.ink.no
                              : '—'}
                      </Table.Cell>
                    )}
                    <Table.Cell>
                      {row.eligible ? text.options.eligible.yes : text.options.eligible.no}
                    </Table.Cell>
                    <Table.Cell>{row.provider?.label ?? '—'}</Table.Cell>
                    <Table.Cell>
                      {row.products.length > 0
                        ? row.products.map((product) => product.label).join(', ')
                        : '—'}
                    </Table.Cell>
                    <Table.Cell>{row.semen_or_embryo?.label ?? '—'}</Table.Cell>
                    <Table.Cell>{row.batch?.label ?? '—'}</Table.Cell>
                  </Table.Row>
                </Fragment>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Timeline rica — `data.timeline` já pronta do servidor
          (`buildTimeline()`); nunca recalculada aqui (regra 2 da
          `TASK-BM-FE-23`). Nome do protocolo precede a sequência, omitido
          quando `description` vier `null` (TC-FE-BM-96). */}
      {protocol.description && (
        <Text fontWeight="semibold" color="fg.default" mt={6}>
          {`${timelineText.protocolNamePrefix} - ${protocol.description}`}
        </Text>
      )}

      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        mt={protocol.description ? 3 : 6}
        mb={2}
      >
        {timelineText.timelineTitle}
      </Text>

      {protocol.timeline.length === 0 ? (
        <Text fontSize="sm" color="fg.muted" py={2}>
          {detailText.emptySection}
        </Text>
      ) : (
        <Box overflowX="auto" pb={2}>
          <Flex
            role="list"
            aria-label={timelineText.timelineTitle}
            align="flex-start"
            gap={0}
            minW="max-content"
          >
            {protocol.timeline.map((step, index) => {
              const products = pairedProducts(step);
              const services = realServices(step);
              const isLast = index === protocol.timeline.length - 1;

              return (
                <Box
                  key={`${step.protocol_identification}-${index}`}
                  role="listitem"
                  minW="240px"
                  maxW="260px"
                  flexShrink={0}
                >
                  {/* Nó (indicador circular) + conector para a próxima etapa —
                      linguagem visual adaptada de `WorkflowTimeline.tsx`
                      (`cerne`), sem import direto do componente. */}
                  <Flex align="center" pr={isLast ? 0 : 2}>
                    <Flex
                      boxSize="8"
                      flexShrink={0}
                      borderRadius="full"
                      bg="bg.emphasized"
                      border="1px solid"
                      borderColor="border.default"
                      color="fg.default"
                      align="center"
                      justify="center"
                      fontSize="xs"
                      fontWeight="semibold"
                    >
                      {index + 1}
                    </Flex>
                    {!isLast && <Box flex="1" h="2px" bg="border.subtle" aria-hidden="true" />}
                  </Flex>

                  <Box
                    mt={2}
                    p={3}
                    bg="bg.panel"
                    border="1px solid"
                    borderColor="border.subtle"
                    borderRadius="md"
                  >
                    <Text fontSize="sm" fontWeight="semibold" color="fg.default">
                      {step.weekday}
                    </Text>
                    <Text fontSize="xs" color="fg.muted" mb={2}>
                      {[step.date ? formatDate(step.date) : null, step.time]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </Text>

                    <Text fontSize="xs" color="fg.muted">
                      {`${timelineText.timelineService}: ${
                        services.length > 0 ? services.join(', ') : '—'
                      }`}
                    </Text>

                    <Text fontSize="xs" color="fg.muted">
                      {`${timelineText.timelineProducts}: ${
                        products.length > 0
                          ? products.map((pair) => `${pair.product} (${pair.quantity})`).join(', ')
                          : '—'
                      }`}
                    </Text>
                    {products.length > 0 && step.measurement && (
                      <Text fontSize="xs" color="fg.muted">
                        {step.measurement}
                      </Text>
                    )}

                    <Text fontSize="xs" color="fg.muted" mt={2}>
                      {`${timelineText.timelineIdentification}: ${step.protocol_identification}`}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {`${timelineText.timelineDaysFromPrevious}: ${step.days_from_previous}`}
                    </Text>
                  </Box>
                </Box>
              );
            })}
          </Flex>
        </Box>
      )}
    </Box>
  );
}

export default ProtocolDetailBlock;
