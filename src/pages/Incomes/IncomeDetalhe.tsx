// src/pages/Incomes/IncomeDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de UMA parcela de Income — TASK-FE-036-317.
// Mirror estrutural de `DetalheCentroCusto.tsx` (`FormContainer` +
// `headerActions` + `InfoField`/`DetailPanel` locais), com uma seção NOVA
// sem equivalente em Invoice: Rateio (`IncomeResource.categories[]` vem
// populado no `show`, diferente de Invoice que é write-only).
//
// "Conta Contábil" e "Centro de Custo" de cada linha de rateio vêm direto do
// `IncomeResource` (`plan_account.name`/`center_description`, GAP-API 036fix
// resolvido — INC-R17, REAUDITORIA-036-2a-rodada); "—" só aparece quando a
// linha realmente não tem conta/centro vinculado.
//
// Painel "Baixas" (AM11/IG15/IG16, TASK-FE-036-333) — `WriteOffActiveList`
// COMPARTILHADO (Tarefa 332, `segment='incomes'`) + botão "Nova baixa" que
// abre `WriteOffCreateModal` (Tarefa 331) quando `balance>0`. O componente
// compartilhado não conhece `queryKey` de Income — a invalidação de
// `incomeDetail`/lista é feita AQUI, via `onSuccess`/`onCancelled`.
//
// Painel "Documentos Anexos" (AM06/LM01, TASK-FE-036-339) — `DocumentPanel`
// COMPARTILHADO (Tarefa 338, `segment='incomes'`), mirror EXATO da seção de
// Baixas acima: sempre visível (sem gate condicional da SEÇÃO), só os botões
// internos de upload/remoção são gateados via props. 3 permissões DEDICADAS
// (`incomedocument_view/create/delete`) — NUNCA `incomes_edit`.
// -----------------------------------------------------------------------------

import { ElementType, ReactNode, useState } from 'react';

import {
  Badge,
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { FiAlertTriangle, FiDollarSign, FiDownload, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DocumentPanel } from '@/components/Document';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';
import { WriteOffActiveList } from '@/components/WriteOff/WriteOffActiveList';
import { WriteOffCreateModal } from '@/components/WriteOff/WriteOffCreateModal';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { downloadBlob } from '@/utils/downloadBlob';
import formatDate from '@/utils/formatDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

// B-05 (TASK-FE-036-340/342, Onda 3 sub-onda 3f) — módulo COMPARTILHADO,
// `downloadXml('incomes', uuid)` devolve o binário puro (SEM envelope
// `ApiResponse`), mirror `ImportExportActions.tsx` (`downloadBlob` já
// existente).
import { downloadXml } from '@/services/v2/XmlPrefill/xml-prefill-service';

import {
  deriveIncomeStatus,
  INCOME_STATUS_COLOR_PALETTE,
  isIncomeEligibleForWriteOff,
} from './income-status';
import { useIncomeDetail } from './useIncomes';

const INCOMES_LIST_ROUTE = '/financeiro/receber';

function InfoField({ label, value }: { label: string; value: string }) {
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
      <Text fontSize="sm" color="fg.default">
        {value}
      </Text>
    </Box>
  );
}

function DetailPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={4}
        pb={2}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        {title}
      </Text>
      {children}
    </Box>
  );
}

export default function IncomeDetalhe() {
  const { incomeId } = useParams<{ incomeId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.incomes.income;

  const incomeQuery = useIncomeDetail(incomeId);
  const income = incomeQuery.data;
  const isLoading = incomeQuery.isLoading || incomeQuery.isPending;
  const notFound = !isLoading && incomeQuery.isError;

  // ---- Baixa Manual (AM11/IG15/IG16, TASK-FE-036-333) ----
  const [isWriteOffModalOpen, setIsWriteOffModalOpen] = useState(false);

  function handleWriteOffChanged() {
    queryClient.invalidateQueries({ queryKey: [queryKey.incomes.income, incomeId] });
    queryClient.invalidateQueries({ queryKey: [queryKey.incomes.incomes] });
  }

  // ---- Documentos Anexos (AM06/LM01, TASK-FE-036-339) — MESMA invalidação
  // de `handleWriteOffChanged` (o painel não conhece `queryKey` de Income;
  // `documents_count` vem embutido em `IncomeDetail`/`IncomeListItem`, nenhuma
  // query nova a invalidar). Função própria só por clareza semântica. ----
  function handleDocumentsChanged() {
    queryClient.invalidateQueries({ queryKey: [queryKey.incomes.income, incomeId] });
    queryClient.invalidateQueries({ queryKey: [queryKey.incomes.incomes] });
  }

  // ---- Baixar XML (B-05, TASK-FE-036-340/342) — gated por `xml_key`
  // presente (nunca por `document_type` ou qualquer outro proxy). ⚠️ Achado
  // crítico 1 (TASK-FE-036-340): o backend HOJE não persiste `xml_key` no
  // `store()` — este link nunca aparecerá para títulos criados pelo fluxo
  // real até o Gap de API fechar; construído mesmo assim (só testável com
  // dado semeado manualmente enquanto isso). ----
  const [isDownloadingXml, setIsDownloadingXml] = useState(false);

  async function handleDownloadXml() {
    if (!income?.xml_key) return;
    setIsDownloadingXml(true);
    try {
      const blob = await downloadXml('incomes', income.uuid);
      downloadBlob(blob, `${income.xml_key}.xml`);
    } catch {
      toaster.error({
        title: text.detail.actions.downloadXml,
        description: text.detail.xml.downloadError,
      });
    } finally {
      setIsDownloadingXml(false);
    }
  }

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
                variant="outline"
                size="sm"
                onClick={() => navigate(INCOMES_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const status = income ? deriveIncomeStatus(income) : null;
  const categories = income?.categories ?? [];

  return (
    <FormContainer
      title={income?.number ?? text.singularLabel}
      headerActions={
        income && (
          <Flex align="center" gap={3} flexShrink={0}>
            {status && (
              <Badge colorPalette={INCOME_STATUS_COLOR_PALETTE[status]} variant="subtle">
                {text.list.statusLabels[status]}
              </Badge>
            )}
            {income.xml_key && (
              <Button
                title={text.detail.actions.downloadXml}
                icon={FiDownload as ElementType}
                variant="outline"
                size="sm"
                loading={isDownloadingXml}
                disabled={isDownloadingXml}
                onClick={handleDownloadXml}
              />
            )}
            {can('incomes_edit') && (
              <Button
                title={text.detail.actions.edit}
                icon={FiEdit as ElementType}
                size="sm"
                onClick={() => navigate(`${INCOMES_LIST_ROUTE}/${incomeId}`)}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            <Text fontSize="sm" color="fg.muted">
              {income?.type?.description ?? '—'} · {income?.payment_type_label ?? '—'} ·{' '}
              {income ? `${income.installment}/${income.qtd_installments}` : '—'}
            </Text>

            <DetailPanel title={text.detail.generalData.title}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField label={text.form.fields.number} value={income?.number ?? '—'} />
                <InfoField
                  label={text.form.fields.dtEmission}
                  value={income?.dt_emission ? formatDate(income.dt_emission) : '—'}
                />
                <InfoField
                  label={text.form.fields.dueDate}
                  value={income?.due_date ? formatDate(income.due_date) : '—'}
                />
                {/* L-06/B-06 (auditoria de fidelidade 2026-08) — `IncomeResource`
                    agora devolve `.name`; cai para o uuid só como fallback honesto. */}
                <InfoField
                  label={text.form.fields.client}
                  value={income?.client?.name ?? income?.client?.uuid ?? '—'}
                />
                <InfoField
                  label={text.form.fields.proprietary}
                  value={income?.proprietary?.name ?? income?.proprietary?.uuid ?? '—'}
                />
                <InfoField
                  label={text.form.fields.harvest}
                  value={income?.harvest?.name ?? income?.harvest?.uuid ?? '—'}
                />
                <InfoField
                  label={text.form.fields.fiscalDocument}
                  value={
                    income?.fiscal_document
                      ? languageGB.defaltStrings.yes
                      : languageGB.defaltStrings.no
                  }
                />
                <InfoField label={text.form.fields.note} value={income?.note || '—'} />
              </SimpleGrid>
            </DetailPanel>

            <DetailPanel title={text.detail.financial.title}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField
                  label={text.form.fields.amount}
                  value={
                    income
                      ? income.amount.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                      : '—'
                  }
                />
                <InfoField
                  label={text.list.columns.balance}
                  value={
                    income
                      ? income.balance.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                      : '—'
                  }
                />
                <InfoField
                  label={text.form.fields.discount}
                  value={
                    income
                      ? income.discount.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                      : '—'
                  }
                />
                <InfoField
                  label={text.form.fields.penalty}
                  value={
                    income
                      ? income.penalty.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                      : '—'
                  }
                />
                <InfoField
                  label={text.form.fields.interest}
                  value={
                    income
                      ? income.interest.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                      : '—'
                  }
                />
                <InfoField
                  label={text.form.fields.percInterest}
                  value={income ? `${income.perc_interest.toFixed(2)}%` : '—'}
                />
                <InfoField
                  label={text.form.fields.increase}
                  value={
                    income
                      ? income.increase.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                      : '—'
                  }
                />
                <InfoField
                  label={text.detail.financial.isLocked}
                  value={
                    income?.is_locked ? languageGB.defaltStrings.yes : languageGB.defaltStrings.no
                  }
                />
              </SimpleGrid>
            </DetailPanel>

            <DetailPanel title={text.detail.apportionment.title}>
              {categories.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  {text.detail.apportionment.empty}
                </Text>
              ) : (
                <Table.Root size="sm" variant="outline" striped>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>
                        {text.form.apportionmentTab.fields.category}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {text.form.apportionmentTab.fields.center}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {text.form.apportionmentTab.fields.planAccount}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {text.form.apportionmentTab.fields.percentage}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {text.form.apportionmentTab.fields.valuePreview}
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {categories.map((category) => (
                      <Table.Row key={category.category_uuid}>
                        <Table.Cell>{category.description}</Table.Cell>
                        {/* INC-R17 (REAUDITORIA-036-2a-rodada) — coluna Centro de
                            Custo estava ausente; a API já devolve
                            `center_description`. */}
                        <Table.Cell>
                          {category.center_description ??
                            text.detail.apportionment.planAccountFallback}
                        </Table.Cell>
                        {/* INC-R17 — usa `plan_account.name` retornado pela API em
                            vez do fallback fixo. */}
                        <Table.Cell>
                          {category.plan_account?.name ??
                            text.detail.apportionment.planAccountFallback}
                        </Table.Cell>
                        <Table.Cell>
                          {income && income.amount > 0
                            ? `${((category.value / income.amount) * 100).toFixed(2)}%`
                            : '—'}
                        </Table.Cell>
                        <Table.Cell>
                          {category.value.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
            </DetailPanel>

            <DetailPanel title={text.detail.audit.title}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField
                  label={text.detail.audit.writeoffsCount}
                  value={income ? String(income.writeoffs_count) : '—'}
                />
              </SimpleGrid>
            </DetailPanel>

            {/* AM11/IG15/IG16 (TASK-FE-036-333) — painel de baixas ATIVAS +
                cancelamento, componente COMPARTILHADO (Tarefa 332). Botão
                "Nova baixa" (AM09) só quando `balance>0` E não é
                Adiantamento — MESMO gate de `isIncomeEligibleForWriteOff`
                (`income-status.ts`), reaproveitado, não duplicado. */}
            <DetailPanel title={languageGB.writeOff.list.title}>
              <Flex justify="flex-end" mb={4}>
                {income && can('incomes_edit') && isIncomeEligibleForWriteOff(income) && (
                  <Button
                    title={languageGB.writeOff.form.createTitle}
                    icon={FiDollarSign as ElementType}
                    size="sm"
                    onClick={() => setIsWriteOffModalOpen(true)}
                  />
                )}
              </Flex>
              {income && (
                <WriteOffActiveList
                  segment="incomes"
                  titleUuid={income.uuid}
                  onCancelled={handleWriteOffChanged}
                />
              )}
            </DetailPanel>

            {/* AM06/LM01 (TASK-FE-036-339) — painel de Documentos Anexos,
                componente COMPARTILHADO (Tarefa 338). Seção sempre visível
                (mirror da seção de Baixas acima); só os botões internos de
                upload/remoção são gateados via props. */}
            <DetailPanel title={languageGB.document.panel.title}>
              {income && (
                <DocumentPanel
                  segment="incomes"
                  titleUuid={income.uuid}
                  canView={can('incomedocument_view')}
                  canUpload={can('incomedocument_create')}
                  canDelete={can('incomedocument_delete')}
                  onChanged={handleDocumentsChanged}
                />
              )}
            </DetailPanel>
          </Flex>
        </Skeleton>
      </Box>

      {income && (
        <WriteOffCreateModal
          isOpen={isWriteOffModalOpen}
          onClose={() => setIsWriteOffModalOpen(false)}
          segment="incomes"
          titleUuid={income.uuid}
          titleBalance={income.balance}
          onSuccess={() => {
            setIsWriteOffModalOpen(false);
            handleWriteOffChanged();
          }}
        />
      )}
    </FormContainer>
  );
}
