// src/pages/Administrativo/EntradaInsumos/DetalheEntradaInsumos.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de uma ENTRADA DE INSUMO — correção da
// reprovação AD de F-084 (Execução 063, revisor Arthur): "Tive problemas ao
// cadastrar e não tem a opção de editar o registro, ao visualizar ele abre a
// edição diretamente". Antes desta Tarefa não existia rota/tela de detalhe —
// `/administrativo/entrada-insumos/:uuid` abria SEMPRE
// `CreateOrUpdateEntradaInsumos` (edição), mesmo a partir do ícone "Ver" da
// listagem.
//
// Padrão CANÔNICO obrigatório (DEC-286, supersede DEC-280): mirror ESTRUTURAL
// de `src/pages/CadastrosBase/Produtos/Catalogo/ProdutoDetalhe.tsx` —
// `InputReadOnly` (`@/components/Form/InputReadOnly`) em grade `columnsForm`,
// PROIBIDO `ViewField`/`DetailGrid` (caixas `bg.muted`), fidelidade visual
// light+dark, sem Controller/register/mutation (hook JÁ EXISTENTE
// `useCustomFormQueryByGuid`, reaproveitado só em modo leitura, mesmo
// racional de `ProdutoDetalhe`/`DetalheCentroCusto`/`SafraDetalhe`: `fillForm`
// é um no-op proposital).
//
// Campos EXATAMENTE os exibidos por `CreateOrUpdateEntradaInsumos.tsx` +
// `EntradaInsumosItemsTab.tsx` + `EntradaInsumosAutomaticWriteoffSection.tsx`
// (task-packet: "não invente campos"), em modo leitura:
//   - Cabeçalho: Código, Data, Responsável, Fazenda, Safra, Proprietário,
//     Observações — mesmos rótulos de `formText.fields`.
//
// Labels (DD-078-03/06, T-078-API-01): `harvest`, `measurement`, `cultivation`
// e `center` agora expõem o NOME no contrato (`description`/`name`/`code`),
// então o Detalhe os exibe como a edição. O Gap de contrato F-084 (uuid cru)
// está FECHADO. "Não informado" só aparece quando o ref é nulo/sem nome — NUNCA
// o uuid cru.
//   - Itens: produto, un. medida, quantidade, vl. unitário, vl. total, gera
//     estoque (Badge Sim/Não, mirror `BooleanField` de `ProdutoDetalhe.tsx`),
//     armazém (só quando `generate_stock`, mesmo condicional do form), tipo
//     de apropriação (label resolvido via `inputEntryAppropriationTypeOptions.
//     getLabel`), lote do fornecedor, validade, cultivo, categoria
//     financeira, centro de custo.
//   - Baixa Automática: a seção do FORMULÁRIO é WRITE-ONLY (nunca reidrata,
//     ver comentário de `fillEntradaInsumosForm`) — o equivalente de LEITURA
//     é o `movement` do contrato (`InputEntryMovementRef`, já usado na
//     listagem/`InputEntryListItem`), mostrado aqui quando presente; vazio
//     quando a entrada nunca teve baixa automática.
//
// Ação "Editar" no `headerActions` (mirror EXATO `ProdutoDetalhe.tsx`/
// `DetalheCentroCusto.tsx`) — navega para a rota de edição JÁ EXISTENTE
// (`CreateOrUpdateEntradaInsumos`), gate por `can('input_entries_edit')`
// (rota de edição também passou a exigir essa permissão — ver
// `router/index.tsx`, antes exigia só `input_entries_view` porque a mesma
// tela servia visualização E edição).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import {
  Badge,
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import {
  inputEntryAppropriationTypeOptions,
  type InputEntryAppropriationTypeValue,
} from '@/constants/inputEntries/options/appropriation-type-options';
import { queryKey } from '@/constants/query-key';

import { getInputEntry } from '@/services/v2/InputEntries/input-entry-service';

import type { InputEntryDetail, InputEntryItemDetail } from '@/@types/v2/InputEntries';

import { costCenterOption, NO_LABEL_PLACEHOLDER } from './entradaInsumosHydration';

const INPUT_ENTRY_LIST_ROUTE = '/administrativo/entrada-insumos';

// `fillForm` do hook compartilhado é irrelevante aqui (sem `useForm` nesta
// tela, mesmo racional de `ProdutoDetalhe.tsx`/`DetalheCentroCusto.tsx`) —
// no-op só para satisfazer a assinatura.
function noop() {}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumberPtBr(value: number): string {
  return value.toLocaleString('pt-BR');
}

// Campo de leitura booleana (label + Badge Sim/Não) — mesma adaptação já
// usada em `ProdutoDetalhe.tsx::BooleanField` para "Gera Estoque?".
function BooleanField({
  label,
  value,
  yesLabel,
  noLabel,
}: {
  label: string;
  value: boolean;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={1}
      >
        {label}
      </Text>
      <Badge colorPalette={value ? 'green' : 'gray'} variant="subtle" py={1} px={3}>
        {value ? yesLabel : noLabel}
      </Badge>
    </Box>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      fontSize="sm"
      fontWeight="semibold"
      color="fg.default"
      mb={4}
      pb={2}
      borderBottom="1px solid"
      borderColor="border.subtle"
    >
      {children}
    </Text>
  );
}

export default function DetalheEntradaInsumos() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.inputEntries.inputEntry;
  const formText = text.form;
  const notInformed = text.detail.notInformed;

  // Guarda de navegação — uuid mal formado não deve chegar ao hook de query
  // nem renderizar conteúdo (mesmo racional de `CreateOrUpdateEntradaInsumos.
  // tsx`/`ProdutoDetalhe.tsx`): redireciona para a listagem ANTES de montar
  // qualquer coisa.
  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate(INPUT_ENTRY_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const inputEntryQuery = useCustomFormQueryByGuid<InputEntryDetail>({
    registrationId: isValidGuid(uuid) ? uuid : undefined,
    queryKey: queryKey.inputEntries.inputEntry,
    asyncFunction: getInputEntry,
    fillForm: noop,
  });

  if (!isValidGuid(uuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([inputEntryQuery as any]);
  const detail = (inputEntryQuery as any)?.data as InputEntryDetail | undefined;
  const notFound = !isLoading && (inputEntryQuery as any).isError;
  const canEdit = can('input_entries_edit');

  const yesLabel = languageGB.defaltStrings.yes;
  const noLabel = languageGB.defaltStrings.no;

  if (notFound) {
    return (
      <FormContainer title={text.singularLabel}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{text.detail.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{text.detail.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={text.detail.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                onClick={() => navigate(INPUT_ENTRY_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const items: InputEntryItemDetail[] = detail?.items ?? [];
  const movement = detail?.movement;

  return (
    <FormContainer
      title={detail?.code ? `${text.singularLabel} ${detail.code}` : text.singularLabel}
      headerActions={
        detail &&
        canEdit && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Button
              title={text.list.actions.edit}
              icon={FiEdit as ElementType}
              onClick={() => navigate(`${INPUT_ENTRY_LIST_ROUTE}/${uuid}`)}
            />
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {detail?.date ? formatDate(detail.date) : ''} ·{' '}
            {detail?.proprietary?.name ?? notInformed}
          </Text>
        </Skeleton>

        <Flex direction="column" gap={6} mt={6}>
          {/* ---- Bloco 1 — "Dados Gerais" (mirror cabeçalho de
              CreateOrUpdateEntradaInsumos.tsx) ---- */}
          <Box>
            <SectionTitle>{text.detail.sections.generalData}</SectionTitle>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InputReadOnly
                label={formText.fields.code}
                value={detail?.code ?? ''}
                loading={isLoading}
              />
              <InputReadOnly
                label={formText.fields.date}
                value={detail?.date ? formatDate(detail.date) : ''}
                loading={isLoading}
              />
              <InputReadOnly
                label={formText.fields.responsible}
                value={detail?.user?.name ?? notInformed}
                loading={isLoading}
              />
              <InputReadOnly
                label={formText.fields.farm}
                value={detail?.farm?.description ?? notInformed}
                loading={isLoading}
              />
              <InputReadOnly
                label={formText.fields.harvest}
                value={detail?.harvest?.description?.trim() || notInformed}
                loading={isLoading}
              />
              <InputReadOnly
                label={formText.fields.proprietary}
                value={detail?.proprietary?.name ?? notInformed}
                loading={isLoading}
              />
            </SimpleGrid>
            <Box mt={6}>
              <InputReadOnly
                label={formText.fields.note}
                value={detail?.note?.trim() || notInformed}
                loading={isLoading}
              />
            </Box>
          </Box>

          {/* ---- Bloco 2 — "Itens" (mirror EntradaInsumosItemsTab.tsx) ---- */}
          <Box>
            <SectionTitle>{formText.sections.items}</SectionTitle>

            {items.length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {formText.itemRow.emptyLabel}
              </Text>
            ) : (
              <Flex direction="column" gap={4} mb={4}>
                {items.map((item) => (
                  <Box
                    key={item.uuid}
                    p={4}
                    border="1px solid"
                    borderColor="border.subtle"
                    borderRadius="lg"
                  >
                    <SimpleGrid columns={columnsForm.default} gap={4}>
                      <InputReadOnly
                        label={formText.fields.product}
                        value={item.product?.description ?? notInformed}
                      />
                      {/* Gap de contrato — `InputEntryMeasurementRef` só
                          expõe `uuid` (sem `description`), ver nota de
                          cabeçalho do arquivo. NUNCA exibir o uuid cru. */}
                      <InputReadOnly
                        label={formText.fields.measurement}
                        value={item.measurement?.description?.trim() || notInformed}
                      />
                      <InputReadOnly
                        label={formText.fields.quantity}
                        value={formatNumberPtBr(item.quantity)}
                      />
                      <InputReadOnly
                        label={formText.fields.unitValue}
                        value={formatCurrencyBRL(item.unit_value)}
                      />
                      <InputReadOnly
                        label={formText.fields.totalValue}
                        value={formatCurrencyBRL(item.total_value)}
                      />
                      <BooleanField
                        label={formText.fields.generateStock}
                        value={!!item.generate_stock}
                        yesLabel={yesLabel}
                        noLabel={noLabel}
                      />
                      {item.generate_stock && (
                        <InputReadOnly
                          label={formText.fields.warehouse}
                          value={item.warehouse?.description ?? notInformed}
                        />
                      )}
                      <InputReadOnly
                        label={formText.fields.appropriationType}
                        value={
                          item.appropriation_type
                            ? inputEntryAppropriationTypeOptions.getLabel(
                                item.appropriation_type as InputEntryAppropriationTypeValue,
                                languageGB
                              )
                            : notInformed
                        }
                      />
                      <InputReadOnly
                        label={formText.fields.providerLot}
                        value={item.provider_lot || notInformed}
                      />
                      <InputReadOnly
                        label={formText.fields.shelfLife}
                        value={item.shelf_life || notInformed}
                      />
                      <InputReadOnly
                        label={formText.fields.cultivation}
                        value={item.cultivation?.name?.trim() || notInformed}
                      />
                      <InputReadOnly
                        label={formText.fields.category}
                        value={item.category?.description ?? notInformed}
                      />
                      <InputReadOnly
                        label={formText.fields.center}
                        value={
                          item.center &&
                          costCenterOption(item.center).label !== NO_LABEL_PLACEHOLDER
                            ? costCenterOption(item.center).label
                            : notInformed
                        }
                      />
                    </SimpleGrid>
                  </Box>
                ))}
              </Flex>
            )}

            <InputReadOnly
              label={formText.fields.totalValue}
              value={formatCurrencyBRL(detail?.total_amount ?? 0)}
              loading={isLoading}
            />
          </Box>

          {/* ---- Bloco 3 — "Baixa Automática" (equivalente de LEITURA do
              `movement`, ver nota de cabeçalho do arquivo) ---- */}
          <Box>
            <SectionTitle>{formText.sections.automaticWriteoff}</SectionTitle>
            {movement ? (
              <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
                <InputReadOnly label={text.detail.movement.code} value={movement.code} />
                <InputReadOnly
                  label={text.detail.movement.value}
                  value={formatCurrencyBRL(movement.value)}
                />
                <InputReadOnly
                  label={text.detail.movement.date}
                  value={movement.date ? formatDate(movement.date) : ''}
                />
                <InputReadOnly
                  label={text.detail.movement.account}
                  value={movement.account?.description ?? notInformed}
                />
              </SimpleGrid>
            ) : (
              <Text fontSize="sm" color="fg.muted">
                {text.detail.movement.empty}
              </Text>
            )}
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
