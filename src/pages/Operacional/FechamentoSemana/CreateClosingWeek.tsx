// src/pages/Operacional/FechamentoSemana/CreateClosingWeek.tsx
// -----------------------------------------------------------------------------
// Tela de NOVO FECHAMENTO — TASK-FE-FS-04 (contrato de tela §4, FID-G3F
// SR-02/SR-03/SB-04/SB-06/SB-07/SF-01/SF-02/SH-01/CV-01..06/SE-03).
//
// Rota: `/operacional/fechamento-semana/novo`, guarda `closing_weeks_create`
// (registrada ANTES de `/:uuid`, contrato de especificidade).
//
// Fluxo de 2 FASES na MESMA tela (sem reload de rota):
//   Fase 1 — busca de período (`start_date`/`end_date`, SEMPRE visível):
//     botão "Gerar" dispara `usePreviewClosingWeek` (mutation de LEITURA pura,
//     `GET /closing-weeks/preview`) — o resultado vira `previewData`, estado
//     LOCAL do componente (rascunho de tela, nunca cache de servidor).
//   Fase 2 — relatório + confirmação (condicional a `previewData !== null`):
//     `code`/`week` via `InputReadOnly`; tabela AGRUPADA por `groups[]` (1
//     bloco por cultivo/qualidade) com linhas ITEMIZADAS (GAP-FS-06, mirror
//     `create.blade.php:24-104`, "Demonstrativo de Formação do Preço Médio")
//     + subtotal do grupo (despesas rateadas/preço médio). Botão "Salvar"
//     dispara `useStoreClosingWeek` (`POST /closing-weeks`) com payload
//     EXATO `{start_date,end_date}` (DEC-FS-11/GAP-FS-05) — NENHUM campo do
//     relatório é reenviado, o servidor recomputa tudo de novo.
//
// Armadilha #2 (Leitura do dev da Tarefa) — qualquer `onChange` em
// `start_date`/`end_date` DEPOIS de já haver `previewData` limpa o relatório
// (`setPreviewData(null)`), via `watch()` do RHF sobre os 2 campos —
// implementado abaixo como efeito reagindo à MUDANÇA da data, nunca como
// `useEffect` disparado por `[previewData]`.
//
// Casca canônica (`get_pwa_form_query_pattern`): `FormContainer` + footer
// opt-in, submit do "Gerar" acionado de FORA do `<Form>` via `form={id}`
// (mesmo mecanismo do Dialog v3) — "Salvar"/"Voltar" são ações de botão
// simples (`type="button"`), fora do fluxo de validação do RHF (a Fase 2 não
// tem campos de formulário próprios, é só leitura + confirmação).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Table, Text, VStack } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';

import { fechamentoSemanaSearchSchemaResolver } from '@/validations/schemas/FechamentoSemana/fechamento-semana-search-schema';

import type {
  ClosingWeekPreviewData,
  ClosingWeekPreviewGroup,
  StoreClosingWeekPayload,
} from '@/@types/v2/FechamentoSemana';

import { usePreviewClosingWeek, useStoreClosingWeek } from './useFechamentoSemana';

const CLOSING_WEEKS_LIST_ROUTE = '/operacional/fechamento-semana';
const SEARCH_FORM_ID = 'fechamento-semana-search-form';
const NO_DATA = '—';

interface ClosingWeekSearchFormValues {
  start_date: string | null;
  end_date: string | null;
}

const defaultValues: ClosingWeekSearchFormValues = {
  start_date: null,
  end_date: null,
};

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

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

export default function CreateClosingWeek() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.fechamentoSemana.closingWeek;
  const searchText = text.search;
  const reportText = text.report;

  const [previewData, setPreviewData] = useState<ClosingWeekPreviewData | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ClosingWeekSearchFormValues>({
    mode: 'onChange',
    resolver: fechamentoSemanaSearchSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues,
  });

  const startDate = watch('start_date');
  const endDate = watch('end_date');

  // Armadilha #2 — qualquer mudança nas datas invalida o relatório já gerado,
  // exigindo novo "Gerar" antes de reabilitar "Salvar" (contrato §4.2).
  useEffect(() => {
    setPreviewData(null);
    // Reage à MUDANÇA da data (não ao dado do preview) — deps intencionais.
  }, [startDate, endDate]);

  const previewMutation = usePreviewClosingWeek();

  function onGenerate(data: ClosingWeekSearchFormValues) {
    previewMutation.mutate(
      { start_date: data.start_date!, end_date: data.end_date! },
      {
        onSuccess: (response) => setPreviewData(response.data),
        onError: (error) => {
          toaster.error({
            title: text.singularLabel,
            description: extractApiErrorMessage(error) ?? searchText.businessErrorFallback,
            duration: 7000,
          });
        },
      }
    );
  }

  const storeMutation = useStoreClosingWeek({
    actionSuccess: (data) => navigate(`${CLOSING_WEEKS_LIST_ROUTE}/${data.uuid}`),
  });

  function handleSave() {
    if (!previewData || !startDate || !endDate) return;

    const payload: StoreClosingWeekPayload = { start_date: startDate, end_date: endDate };
    storeMutation.mutate(payload);
  }

  const isGenerating = previewMutation.isPending;
  const isSaving = storeMutation.isPending;
  const canSave = !!previewData && !isGenerating && !isSaving;

  function groupKey(group: ClosingWeekPreviewGroup, index: number): string {
    return group.cultivation_uuid ?? `${group.cultivation_name}-${group.quality ?? ''}-${index}`;
  }

  return (
    <FormContainer
      title={searchText.pageTitle}
      subtitle={searchText.pageSubtitle}
      footer={
        <>
          <Button
            title={reportText.backButton}
            variant="outline"
            type="button"
            onClick={() => navigate(CLOSING_WEEKS_LIST_ROUTE)}
            disabled={isSaving}
          />
          <Button
            title={searchText.generateButton}
            type="submit"
            form={SEARCH_FORM_ID}
            loading={isGenerating}
            disabled={isGenerating || isSaving}
          />
          <Button
            title={reportText.saveButton}
            type="button"
            onClick={handleSave}
            loading={isSaving}
            disabled={!canSave}
          />
        </>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        {/* ---- Fase 1 — busca de período (SEMPRE visível) ------------------ */}
        <Form id={SEARCH_FORM_ID} noPadding onSubmit={handleSubmit(onGenerate)}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mt={2}>
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <Field
                  label={searchText.fields.startDate}
                  isRequired
                  errorText={errors.start_date?.message}
                >
                  <DateInput value={field.value} onChange={field.onChange} disabled={isSaving} />
                </Field>
              )}
            />
            <Controller
              name="end_date"
              control={control}
              render={({ field }) => (
                <Field
                  label={searchText.fields.endDate}
                  isRequired
                  errorText={errors.end_date?.message}
                >
                  <DateInput value={field.value} onChange={field.onChange} disabled={isSaving} />
                </Field>
              )}
            />
          </SimpleGrid>
        </Form>

        {/* ---- Fase 2 — relatório + confirmação (condicional) -------------- */}
        {previewData && (
          <Box mt={10}>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mb={6}>
              <InputReadOnly label={reportText.code} value={previewData.code} />
              <InputReadOnly label={reportText.week} value={String(previewData.week)} />
            </SimpleGrid>

            <Text fontSize="sm" fontWeight="semibold" color="fg.default" mb={4}>
              {reportText.reportTitle}
            </Text>

            {previewData.groups.length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {searchText.emptyReport}
              </Text>
            ) : (
              <VStack align="stretch" gap={6}>
                {previewData.groups.map((group, index) => (
                  <Box
                    key={groupKey(group, index)}
                    p={4}
                    border="1px solid"
                    borderColor="border.subtle"
                    borderRadius="lg"
                  >
                    <Flex justify="space-between" align="center" mb={3}>
                      <Text fontWeight="semibold">
                        {group.cultivation_name}
                        {group.quality ? ` — ${group.quality}` : ''}
                      </Text>
                    </Flex>

                    <Box overflowX="auto">
                      <Table.Root size="sm">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader>{reportText.table.items.date}</Table.ColumnHeader>
                            <Table.ColumnHeader>
                              {reportText.table.items.provider}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader>{reportText.table.items.client}</Table.ColumnHeader>
                            <Table.ColumnHeader>
                              {reportText.table.items.dueDate}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader>
                              {reportText.table.items.quantityFinal}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader>{reportText.table.items.price}</Table.ColumnHeader>
                            <Table.ColumnHeader>
                              {reportText.table.items.totalAmount}
                            </Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {group.items.map((item) => (
                            <Table.Row key={item.item_uuid}>
                              <Table.Cell>{item.date ? formatDate(item.date) : NO_DATA}</Table.Cell>
                              <Table.Cell>{item.provider?.label ?? NO_DATA}</Table.Cell>
                              <Table.Cell>{item.client?.label ?? NO_DATA}</Table.Cell>
                              <Table.Cell>
                                {item.due_date ? formatDate(item.due_date) : NO_DATA}
                              </Table.Cell>
                              <Table.Cell>{formatQuantity(item.quantity_final)}</Table.Cell>
                              <Table.Cell>{formatCurrencyBRL(item.price)}</Table.Cell>
                              <Table.Cell>{formatCurrencyBRL(item.total_amount)}</Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Box>

                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mt={4}>
                      <InfoField
                        label={reportText.table.quantityFinal}
                        value={formatQuantity(group.quantity_final)}
                      />
                      <InfoField
                        label={reportText.table.expenses}
                        value={formatCurrencyBRL(group.expenses)}
                      />
                      <InfoField
                        label={reportText.table.amount}
                        value={formatCurrencyBRL(group.amount)}
                      />
                    </SimpleGrid>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        )}
      </Box>
    </FormContainer>
  );
}
