// src/pages/Fiscal/ArquivosXml/index.tsx
// -----------------------------------------------------------------------------
// Tela "Arquivos XML" (F-133, Gestão Fiscal, esteira 97-Esteiras/008, Tarefa
// 36 — fundação + filtro + consulta agregada + totais). Rota `/fiscal/xml`.
//
// **Esta tela NÃO é uma grid** (AD-F10 do contrato de tela): a API não
// pagina, não aceita `orderBy` e devolve grupos. Molde: filtro inline de
// `src/pages/Fiscal/Dfe/DfeReport.tsx` + tabela read-only de
// `NfeDetalhe.tsx`/`BaixaEstoqueDetalhe.tsx` (`XmlDocumentGroup.tsx`).
//
// Seleção de linhas + baixar ZIP/enviar e-mail são a Tarefa 37 — esta Tarefa
// entrega consulta e totais, isso é esperado (não é entrega incompleta).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, EmptyState, Flex, Icon, Skeleton, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { FiAlertTriangle, FiSearch } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { Select } from '@/components/Form/Select';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { useQueryError } from '@/hooks/useQueryError';

import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import { normalizeDocument } from '@/utils/masks/document';

import { xmlDocumentLaunchedOptions } from '@/constants/Fiscal/xml-document/options/xml-document-launched-options';
import { xmlDocumentStatusOptions } from '@/constants/Fiscal/xml-document/options/xml-document-status-options';
import { xmlDocumentTypeOptions } from '@/constants/Fiscal/xml-document/options/xml-document-type-options';

import {
  downloadXmlDocumentsZip,
  sendXmlDocumentsEmail,
} from '@/services/v2/Fiscal/xml-document-service';

import type { Option } from '@/@types/option';
import type {
  XmlDocumentExportItem,
  XmlDocumentExportPayload,
  XmlDocumentFilterDocument,
  XmlDocumentFilterQuery,
  XmlDocumentFilterStatus,
  XmlDocumentGroupData,
  XmlDocumentType,
} from '@/@types/v2/Fiscal/xml-document';

import { useXmlDocumentIssuers, useXmlDocumentList } from './useXmlDocuments';
import { XmlBulkActionBar } from './XmlBulkActionBar';
import { XmlDocumentGroup, type XmlSelectionKey } from './XmlDocumentGroup';

// GAP-XML-03 (Opção A) / DEC-037 — decisão do dono: nesta fatia, MDFe e DFe
// ainda não têm arquivo XML resolvido pela API (`ResolveXmlDocumentPathAction`
// devolve `null` para os 2 tipos). A linha continua listada e somada
// (fidelidade ao legado, `XmlDocumentGroup.tsx` não filtra/esconde nada); só
// a AÇÃO de exportação (download ZIP / enviar e-mail) fica restrita a estes 2
// tipos. Único ponto desta constante — a fatia seguinte (MDFe/DFe) troca 1
// linha aqui, sem tocar `XmlDocumentGroup.tsx`/`XmlBulkActionBar.tsx`.
const EXPORTABLE_TYPES: XmlDocumentType[] = ['nfe', 'nfse'];
const isXmlDocumentExportable = (type: XmlDocumentType) => EXPORTABLE_TYPES.includes(type);

interface XmlDocumentsFilterFormValues {
  issue: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  document: Option<XmlDocumentFilterDocument>;
  status: Option<XmlDocumentFilterStatus> | null;
  launched: Option<'0' | '1'> | null;
}

export default function ArquivosXml() {
  const { languageGB } = useLanguage();
  const text = languageGB.xmlDocuments;

  const documentOptions = xmlDocumentTypeOptions.options(languageGB);
  const statusOptions = xmlDocumentStatusOptions.options(languageGB);
  const launchedOptions = xmlDocumentLaunchedOptions.options(languageGB);
  const defaultDocumentOption = xmlDocumentTypeOptions.getOption('todos', languageGB);

  const issuersQuery = useXmlDocumentIssuers();
  const issuerOptions: Option<string>[] = (issuersQuery.data ?? []).map((issuer) => ({
    label: issuer.full_description,
    value: issuer.uuid,
  }));

  const { control, handleSubmit, reset } = useForm<XmlDocumentsFilterFormValues>({
    defaultValues: {
      issue: null,
      start_date: null,
      end_date: null,
      document: defaultDocumentOption,
      status: null,
      launched: null,
    },
  });

  // `appliedFilters` — o form NÃO alimenta a query direto (AD-F03): só o
  // submit comita este estado, e é ele que liga `enabled` no `useQuery`.
  const [appliedFilters, setAppliedFilters] = useState<XmlDocumentFilterQuery | null>(null);

  const listQuery = useXmlDocumentList(appliedFilters);
  useQueryError([listQuery]);

  // ---- Seleção múltipla (Tarefa 37) — chave composta, local nesta página --
  // (AD-F10: sem `TableProvider` aqui; a projeção vem de 4 tabelas distintas
  // — `uuid` isolado não é chave única entre ramos, item 1 da Tarefa).
  const [selected, setSelected] = useState<Record<XmlSelectionKey, XmlDocumentExportItem>>({});
  const selectedItems = useMemo(() => Object.values(selected), [selected]);
  const selectedCount = selectedItems.length;

  function handleToggleItem(item: XmlDocumentExportItem) {
    if (!isXmlDocumentExportable(item.type)) return;
    const key: XmlSelectionKey = `${item.type}:${item.uuid}`;
    setSelected((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: item };
    });
  }

  function handleToggleGroup(group: XmlDocumentGroupData, checked: boolean) {
    setSelected((prev) => {
      const next = { ...prev };
      group.items.forEach((docItem) => {
        if (!isXmlDocumentExportable(docItem.document_type)) return;
        const key: XmlSelectionKey = `${docItem.document_type}:${docItem.uuid}`;
        if (checked) next[key] = { type: docItem.document_type, uuid: docItem.uuid };
        else delete next[key];
      });
      return next;
    });
  }

  function clearSelection() {
    setSelected({});
  }

  // Reset obrigatório nas 3 transições (item 3 da Tarefa): nova consulta
  // submetida OU `Limpar` — ambas mudam `appliedFilters` (inclusive para
  // `null`), única dependência deste efeito. A 3ª transição (ação bem-
  // sucedida) é tratada no `onSuccess` de cada mutation, abaixo. Não
  // persistir seleção em localStorage/URL — o legado não persistia.
  useEffect(() => {
    setSelected({});
  }, [appliedFilters]);

  // ---- Baixar ZIP (AD-F07/F08) — binário no 200, envelope JSON no 422 -----
  const downloadMutation = useMutation({
    mutationFn: (payload: XmlDocumentExportPayload) => downloadXmlDocumentsZip(payload),
    onSuccess: (blob, variables) => {
      // Nome montado no cliente (padrão vigente do fork) — idêntico ao
      // legado e ao que o servidor manda no header, nunca parseado do
      // `Content-Disposition`.
      const cpfCnpj =
        issuersQuery.data?.find((issuer) => issuer.uuid === variables.issue)?.cpf_cnpj ??
        variables.issue;
      downloadBlob(blob, `xml_${normalizeDocument(cpfCnpj)}.zip`);
      toaster.success({ title: text.pageTitle, description: text.actions.downloadSuccess });
      clearSelection();
    },
    onError: async (error) => {
      // Extração em 3 níveis (armadilha 1 / item 4 da Tarefa): com
      // `responseType: 'blob'` o corpo de erro do 422 TAMBÉM chega como
      // `Blob` — ler às cegas entregaria ao usuário um `.zip` com JSON
      // dentro, sem a mensagem literal do legado.
      let message: string | undefined;
      if (isAxiosError(error) && error.response?.data instanceof Blob) {
        try {
          const rawText = await error.response.data.text();
          const parsed = JSON.parse(rawText);
          if (parsed && typeof parsed.message === 'string') message = parsed.message;
        } catch {
          // corpo do blob não é JSON válido — cai para o próximo nível.
        }
      }
      if (!message) message = extractApiErrorMessage(error);
      if (!message) message = text.actions.downloadError;
      toaster.error({ title: text.pageTitle, description: message });
    },
  });

  // ---- Enviar por e-mail (AD-F08) — 202 é "enfileirado", nunca "enviado" --
  const sendEmailMutation = useMutation({
    mutationFn: (payload: XmlDocumentExportPayload) => sendXmlDocumentsEmail(payload),
    onSuccess: () => {
      toaster.success({ title: text.pageTitle, description: text.actions.sendEmailSuccess });
      clearSelection();
    },
    onError: (error) => {
      // Este endpoint devolve envelope JSON normal (sem blob) — extração de
      // 1 nível basta.
      toaster.error({
        title: text.pageTitle,
        description: extractApiErrorMessage(error) || text.actions.sendEmailError,
      });
    },
  });

  const isBulkActionPending = downloadMutation.isPending || sendEmailMutation.isPending;

  function handleDownload() {
    // Guard local — a barra já não aparece com 0 selecionados; evita um
    // request `documents: []` que a API rejeitaria com 422 de validação.
    if (selectedCount === 0 || !appliedFilters) return;
    downloadMutation.mutate({ issue: appliedFilters.issue, documents: selectedItems });
  }

  function handleSendEmail() {
    if (selectedCount === 0 || !appliedFilters) return;
    sendEmailMutation.mutate({ issue: appliedFilters.issue, documents: selectedItems });
  }

  function onSubmit(data: XmlDocumentsFilterFormValues) {
    if (
      !data.issue?.value ||
      !data.start_date ||
      !data.end_date ||
      !data.document?.value ||
      !data.status?.value
    ) {
      toaster.warning({ title: text.pageTitle, description: text.filter.incompleteWarning });
      return;
    }

    setAppliedFilters({
      issue: data.issue.value,
      start_date: data.start_date,
      end_date: data.end_date,
      document: data.document.value,
      status: data.status.value,
      launched: data.launched?.value,
    });
  }

  function handleClear() {
    reset({
      issue: null,
      start_date: null,
      end_date: null,
      document: defaultDocumentOption,
      status: null,
      launched: null,
    });
    setAppliedFilters(null);
  }

  // ---- Derivação dos 4 estados de tela (AD-F03/contrato de tela §6) -------
  const isLoading = listQuery.isPending && listQuery.isFetching;
  const queryExecuted = listQuery.data?.queryExecuted ?? false;
  const groups = listQuery.data?.groups ?? [];

  // "aguardando filtros": sem filtros aplicados, OU a API devolveu
  // `query_executed:false` (200, NUNCA erro/vazio — armadilha 1).
  const showAwaitingFilters =
    appliedFilters === null ||
    (!isLoading && !listQuery.isError && listQuery.isSuccess && !queryExecuted);
  const showEmpty = !isLoading && queryExecuted && groups.length === 0;
  const showResults = !isLoading && queryExecuted && groups.length > 0;

  return (
    <>
      <ContainerGrid>
        <VStack align="stretch" gap={1} mb={6}>
          <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
            {text.pageTitle}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {text.pageSubtitle}
          </Text>
        </VStack>

        {/* `overflowY="auto"` + `minH={0}` — sem isso, a `ContainerGrid`
            (que já entrega `flex:'0 1 auto'; minHeight:0` ao seu último
            filho de fluxo, permitindo-o encolher dentro da área com
            `overflow:hidden` do `PageCard`) só CLIPA o excesso em vez de
            rolar: nada aqui muda o layout visível, só destrava o scroll do
            que já ficava invisível abaixo da dobra. Ver Table.tsx:131 e
            FormContainer.tsx:96 para o mesmo padrão já usado no fork. */}
        <VStack align="stretch" gap={6} minH={0} overflowY="auto">
          <Box as="form" onSubmit={handleSubmit(onSubmit)}>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4}>
              <Controller
                name="issue"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.filter.issuer}
                    placeholder={text.filter.issuerPlaceholder}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={issuerOptions}
                    loading={issuersQuery.isPending}
                    isRequired
                  />
                )}
              />

              <Controller
                name="start_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Field label={text.filter.startDate} isRequired>
                    <DateInput value={value} onChange={onChange} />
                  </Field>
                )}
              />

              <Controller
                name="end_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Field label={text.filter.endDate} isRequired>
                    <DateInput value={value} onChange={onChange} />
                  </Field>
                )}
              />

              <Controller
                name="document"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.filter.document}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={documentOptions}
                    noClearable
                    isRequired
                  />
                )}
              />

              <Controller
                name="status"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.filter.status}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={statusOptions}
                    isRequired
                  />
                )}
              />

              {/* `launched` fica SEMPRE visível/habilitado (armadilha 5 — NÃO
                é cascata do campo `document`; é o servidor que só o aplica
                ao ramo DFe). */}
              <Controller
                name="launched"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.filter.launched}
                    placeholder={text.filter.launchedPlaceholder}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={launchedOptions}
                  />
                )}
              />
            </SimpleGrid>

            <Flex gap={3} mt={4}>
              <Button
                title={text.filter.submitButton}
                type="submit"
                loading={listQuery.isFetching}
              />
              <Button
                title={text.filter.clearButton}
                type="button"
                variant="ghost"
                onClick={handleClear}
              />
            </Flex>
          </Box>

          {showAwaitingFilters && (
            <EmptyState.Root size="sm">
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiSearch} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.awaitingFiltersTitle}</EmptyState.Title>
                  <EmptyState.Description>{text.awaitingFiltersDescription}</EmptyState.Description>
                </VStack>
              </EmptyState.Content>
            </EmptyState.Root>
          )}

          {isLoading && (
            <VStack align="stretch" gap={4}>
              <Skeleton loading height="60px" borderRadius="md" />
              <Skeleton loading height="160px" borderRadius="md" />
            </VStack>
          )}

          {showEmpty && (
            <EmptyState.Root size="sm">
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.emptyTitle}</EmptyState.Title>
                  <EmptyState.Description>{text.emptyDescription}</EmptyState.Description>
                </VStack>
              </EmptyState.Content>
            </EmptyState.Root>
          )}

          {showResults && (
            <VStack align="stretch" gap={6}>
              {/* Total geral — SEMPRE do servidor (`meta`), nunca somado no
                cliente (AD-F12). */}
              <Flex
                justify="space-between"
                align="center"
                bg="bg.muted"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="lg"
                px={4}
                py={3}
              >
                <Text fontSize="sm" fontWeight="semibold" color="fg.default">
                  {text.totalsLabel} — {listQuery.data?.totalCount ?? 0} docs
                </Text>
                <Text fontSize="md" fontWeight="bold" color="brandColorText">
                  {formatCurrencyBRL(listQuery.data?.totalAmount ?? 0)}
                </Text>
              </Flex>

              {groups.map((group) => (
                <XmlDocumentGroup
                  key={group.document_type}
                  group={group}
                  selectedKeys={selected}
                  onToggleItem={handleToggleItem}
                  onToggleGroup={handleToggleGroup}
                  isSelectable={isXmlDocumentExportable}
                />
              ))}
            </VStack>
          )}
        </VStack>
      </ContainerGrid>

      {/* Fora do `ContainerGrid` de propósito: `position="fixed"` já tira a
          barra do fluxo visual (mesmo comportamento de antes), mas mantê-la
          como filho fazia dela o `:last-child` sempre que havia seleção —
          quebrando a regra de scroll da `ContainerGrid` (que só trata o
          ÚLTIMO filho de fluxo) justamente quando o usuário mais precisa
          rolar a lista para selecionar mais itens. */}
      <XmlBulkActionBar
        count={selectedCount}
        noun={text.actions.noun}
        onClose={clearSelection}
        clearLabel={text.actions.clearSelection}
        actions={[
          {
            label: text.actions.downloadZip,
            onClick: handleDownload,
            loading: downloadMutation.isPending,
            disabled: isBulkActionPending,
          },
          {
            label: text.actions.sendEmail,
            onClick: handleSendEmail,
            loading: sendEmailMutation.isPending,
            disabled: isBulkActionPending,
          },
        ]}
      />
    </>
  );
}
