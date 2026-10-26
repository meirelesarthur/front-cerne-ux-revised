// src/pages/Administrativo/Solicitacao/RequestQuotationFormDialog.tsx
// -----------------------------------------------------------------------------
// Dialog Criar/Editar Cotação (RequestQuotation — Administrativo/Suprimentos,
// esteira 97-Esteiras/035, TASK-CQ-FE-04). Acionado pelos stubs "Adicionar
// Fornecedor"/"Editar" de `RequestQuotationTab.tsx` (TASK-CQ-FE-03).
//
// Composição: PADRÃO 14 (`get_pwa_complex_screen_compositions_pattern`,
// "Modal Form com Dialog Chakra V3") — `Dialog.Root > Portal > Backdrop +
// Positioner > Content`, `<Form>` (que já É o `<form>`) envolvendo
// `Dialog.Body` + `Dialog.Footer`, `useMutation` DIRETO com `toaster` local
// (não `useRequest` — nenhum Dialog real deste fork usa `useRequest`; mirror
// estrutural exato de `GerarDepreciacaoModal.tsx`/`RequestQuotationTab.tsx`
// (mutação de exclusão, mesmo arquivo)). Fill via `useEffect` + `reset`
// (Pattern 14 regra 6 — sem `useCustomFormQueryById`, o dado de edição já
// chega pronto via prop `quotation`, populado pela grade da própria aba).
//
// Mesmos 4 campos (FIELD-01..04, `RequestQuotationForm`/`request-quotation-
// schema.ts` de TASK-CQ-FE-01) para CRIAR e EDITAR — `RequestQuotationPayload`
// real do backend só aceita `provider_uuid`/`branch_uuid`/`requires_file`/
// `note` em AMBOS os verbos (mirror CL-025/026, comentário do service). A
// diferença entre os dois modos é de CONTEXTO, não de campos:
//   - CRIAR: `request_purchase_uuid` é injetado da solicitação já aberta
//     (prop, nunca editável pelo usuário) — todos os 4 campos ficam
//     habilitados.
//   - EDITAR: `request_purchase_uuid` do registro existente é preservado
//     (nunca reenviado como o da prop — o Executor usa sempre
//     `quotation.request_purchase.uuid` quando presente, com fallback para a
//     prop apenas por defesa). `provider_uuid`/`branch_uuid` ficam
//     `disabled` quando `status===3` (CL-024, default de engenharia já
//     fechado no roteiro frontend §2 — comportamento observável idêntico a
//     qualquer leitura do encadeamento legado `->readonly()->readonly()`).
//
// Cascata `provider_uuid` → `branch_uuid` (CL-021/022, IG-01): NÃO usa
// `SelectAsyncPaginate` para `branch_uuid` — a filial vem INTEIRA dentro de
// `GET /providers/{uuid}` (`ProviderDetail.branches[]`, já usado pelo módulo
// Provider), então é um `Select` comum + `useQuery` (mirror
// `RomaneioItemRow.tsx` §"Satélites planos — armadilha #1 — Select +
// useQuery, nunca SelectAsyncPaginate" — mesma disciplina aplicada aqui:
// não existe endpoint paginado de filiais por fornecedor). `branch_uuid`
// fica `disabled` até haver `provider_uuid` (sem opções ainda, CL-024) e é
// resetado para `null` quando o usuário TROCA de fornecedor (nunca durante o
// `reset()` de carga inicial — o clear mora no `onChange` do
// `SelectAsyncPaginate`, que só dispara em interação real do usuário).
//
// `SelectAsyncPaginate`/`Select` usam `disablePortal` — OBRIGATÓRIO dentro de
// `Dialog.Root` (TASK-FE-706/DF-31, comentário completo em
// `SelectAsyncPaginate.tsx`): sem isso, o menu portalizado em `document.body`
// fica visível porém NÃO-CLICÁVEL (fora da árvore `aria-hidden`/`inert` do
// Dialog).
//
// 422 do backend mapeado por campo via `setError` (mirror
// `CreateOrUpdateFuncao.tsx`) — os 4 nomes de campo do form são IDÊNTICOS aos
// da API (`provider_uuid`/`branch_uuid`/`requires_file`/`note`), sem
// necessidade de tradução de chave.
//
// -- Execução 081, T-081-FE-08 (contrato LEGADO 05 P04 e P09) --
//   - P09: com a cotação recebida (status 3) fornecedor, filial E "Exigir
//     informações técnicas do produto" ficam somente leitura
//     (`getLockedQuotationFields`);
//   - P04: ao escolher o fornecedor aparece o quadro "Sobre o fornecedor" (razão
//     social, fantasia, e-mail, telefone, celular, cidade) com o detalhe que a
//     cascata de filiais já busca (sem requisição extra). O celular vem de
//     `GET /providers/{uuid}` (`cellphone`, T-081-API-10 / FE-11 complemento).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Dialog, Portal, SimpleGrid, Skeleton, Table, Text } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { queryKey } from '@/constants/query-key';
import { requestQuotationRequiresFileOptions } from '@/constants/RequestQuotations/options';

import requestQuotationSchemaResolver from '@/validations/schemas/RequestQuotations/request-quotation-schema';

import {
  getProviderByUuid,
  listProviderOptions,
  type ProviderOptionItem,
} from '@/services/v2/CadastrosBase/Provider/provider-service';
import {
  createRequestQuotation,
  updateRequestQuotation,
} from '@/services/v2/RequestQuotations/request-quotation-service';

import type { Option } from '@/@types/option';
import type {
  RequestQuotationData,
  RequestQuotationForm as RequestQuotationFormValues,
  RequestQuotationPayload,
} from '@/@types/v2/RequestQuotations';

import { buildProviderBoard, getLockedQuotationFields } from './quotationGuards';

export interface RequestQuotationFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** UUID da `RequestPurchase` pai — SEMPRE o contexto injetado, nunca um
   *  campo editável pelo usuário (ver cabeçalho do arquivo). */
  requestPurchaseUuid: string;
  /** `null` = modo CRIAR. Objeto presente = modo EDITAR (dado já carregado
   *  pela grade da aba — sem `useCustomFormQueryById` própria, Pattern 14
   *  regra 6). */
  quotation: RequestQuotationData | null;
}

// Aceita tanto `ProviderBranchDetail` (do lookup `GET /providers/{uuid}`,
// cascata) quanto `RequestQuotationBranchRef` (já embutido no
// `RequestQuotationData.branch` para a pré-carga em modo EDITAR) — ambos
// expõem `{uuid, name, nif}`, único subconjunto que este rótulo usa.
function buildBranchLabel(branch: { name: string | null; nif: string | null }): string {
  return branch.name || branch.nif || '';
}

export function RequestQuotationFormDialog({
  isOpen,
  onClose,
  requestPurchaseUuid,
  quotation,
}: RequestQuotationFormDialogProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.requestQuotations.requestQuotation;

  const isEditing = !!quotation;
  // CL-024 (default de engenharia, roteiro frontend §2): `provider_uuid`/
  // `branch_uuid` ficam `readonly` quando a cotação já foi `recebida`.
  // P09 (081): com a cotação recebida o legado trava fornecedor, filial E
  // "Exigir informações técnicas do produto" (o front travava só os dois primeiros).
  const lockedFields = getLockedQuotationFields(quotation?.status);

  function buildDefaultValues(source: RequestQuotationData | null): RequestQuotationFormValues {
    return {
      provider_uuid: source?.provider
        ? { label: source.provider.name ?? '', value: source.provider.uuid }
        : null,
      branch_uuid: source?.branch
        ? { label: buildBranchLabel(source.branch), value: source.branch.uuid }
        : null,
      requires_file: requestQuotationRequiresFileOptions.getOption(
        source?.requires_file ?? false,
        languageGB
      ),
      note: source?.note ?? '',
    };
  }

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<RequestQuotationFormValues>({
    resolver: requestQuotationSchemaResolver(languageGB),
    defaultValues: buildDefaultValues(null),
  });

  // Fill via `useEffect` + `reset` — Pattern 14 regra 6 (sem
  // `useCustomFormQueryById`; `unmountOnExit` na casca garante um form novo a
  // cada abertura, o reset explícito é defensivo, mirror
  // `GerarDepreciacaoModal.tsx`).
  useEffect(() => {
    if (!isOpen) return;
    reset(buildDefaultValues(quotation));
  }, [isOpen, quotation]);

  // ---- Cascata provider_uuid → branch_uuid (CL-021/022/IG-01) ------------
  const providerOption = watch('provider_uuid');
  const providerUuid = providerOption?.value;

  const providerDetailQuery = useQuery({
    queryKey: [queryKey.cadastrosBase.provider, providerUuid],
    queryFn: async () => (await getProviderByUuid(providerUuid!)).data,
    enabled: !!providerUuid,
  });

  const branchOptions: Option<string>[] = (providerDetailQuery.data?.branches ?? []).map(
    (branch) => ({ label: buildBranchLabel(branch), value: branch.uuid })
  );

  // ---- Mutação (useMutation DIRETO + toaster local — Pattern 14 regra 5) --
  const quotationMutation = useMutation({
    mutationFn: (payload: RequestQuotationPayload) =>
      isEditing && quotation
        ? updateRequestQuotation(quotation.uuid, payload)
        : createRequestQuotation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKey.requestQuotations.requestQuotationsByPurchase, requestPurchaseUuid],
      });
      // Mantém a coluna "Cotações" do hub (TASK-CQ-FE-02) coerente após
      // criar/editar — mesma invalidação já usada na exclusão
      // (`RequestQuotationTab.tsx`).
      queryClient.invalidateQueries({ queryKey: [queryKey.requestPurchases.requestPurchasesList] });
      toaster.success({
        title: text.singularLabel,
        description: isEditing ? text.form.updatedToast : text.form.createdToast,
        duration: 7000,
      });
      onClose();
    },
    onError: (error: unknown) => {
      // 422 do backend mapeado por campo — mesma técnica de
      // `CreateOrUpdateFuncao.tsx`. Os nomes de campo do form são idênticos
      // aos da API (`provider_uuid`/`branch_uuid`/`requires_file`/`note`).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof RequestQuotationFormValues, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }

      const errorMessage =
        isAxiosError(error) && (error.response?.data as { message?: string })?.message
          ? (error.response!.data as { message: string }).message
          : text.form.errorFallback;

      toaster.error({ title: text.singularLabel, description: errorMessage, duration: 7000 });
    },
  });

  function onSubmit(data: RequestQuotationFormValues) {
    if (!data.provider_uuid) return; // guarda defensiva — schema já exige

    const payload: RequestQuotationPayload = {
      provider_uuid: data.provider_uuid.value,
      // Em edição, preserva o `request_purchase_uuid` ORIGINAL do registro
      // (imutável no update, `UpdateRequestQuotationAction` real ignora o
      // valor enviado, mas o contrato do Form Request exige o campo presente
      // em ambos os verbos — ver comentário do service). Fallback para a
      // prop de contexto por defesa (nunca deveria faltar em `show()`).
      request_purchase_uuid: quotation?.request_purchase?.uuid ?? requestPurchaseUuid,
      branch_uuid: data.branch_uuid?.value ?? null,
      requires_file: !!data.requires_file?.value,
      note: data.note?.trim() || null,
    };

    quotationMutation.mutate(payload);
  }

  function handleClose() {
    if (quotationMutation.isPending) return;
    onClose();
  }

  const isProviderDisabled = lockedFields.provider;
  const isBranchDisabled = !providerUuid || lockedFields.branch;
  const isRequiresFileDisabled = lockedFields.requiresFile;

  // P04 (081): quadro "Sobre o fornecedor" ao escolher o fornecedor; o celular
  // vem de `GET /providers/{uuid}` (`cellphone`).
  const boardText = text.stage.providerBoard;
  const providerDetail = providerDetailQuery.data;
  const providerBoard = providerDetail
    ? buildProviderBoard({
        name: providerDetail.name,
        nickname: providerDetail.nickname,
        email: providerDetail.email,
        phone: providerDetail.phone,
        cellphone: providerDetail.cellphone ?? null,
        city: providerDetail.city?.name ?? null,
      })
    : [];

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) handleClose();
      }}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{isEditing ? text.form.editTitle : text.form.createTitle}</Dialog.Title>
            </Dialog.Header>

            <Form noPadding onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  {/* FIELD-01 — provider_id, required, SelectAsyncPaginate
                      tenant-scoped (CL-021, `listProviderOptions`). */}
                  <Controller
                    name="provider_uuid"
                    control={control}
                    render={({ field, fieldState }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.form.fields.provider}
                        placeholder={text.form.placeholders.provider}
                        error={fieldState.error?.message as string | undefined}
                        service={listProviderOptions}
                        mapOptions={(item: ProviderOptionItem) => ({
                          label: item.label,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={field.value ?? undefined}
                        onChange={(option: any) => {
                          field.onChange(option ?? null);
                          // Cascata: trocar de fornecedor invalida a filial
                          // já escolhida (CL-021/022) — só dispara em
                          // interação real do usuário, nunca no `reset()` de
                          // carga inicial (`onChange` do wrapper não é
                          // chamado por `reset`).
                          if ((option?.value ?? null) !== (field.value?.value ?? null)) {
                            setValue('branch_uuid', null, { shouldDirty: true });
                          }
                        }}
                        isRequired
                        isDisabled={isProviderDisabled || quotationMutation.isPending}
                        disablePortal
                      />
                    )}
                  />

                  {/* FIELD-02 — branch_id, opcional, dependente de
                      provider_uuid (CL-021/022/IG-01) — Select comum +
                      useQuery (branches vêm inteiras no GET do provider). */}
                  <Controller
                    name="branch_uuid"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Select
                        name={field.name}
                        label={text.form.fields.branch}
                        placeholder={
                          providerUuid
                            ? text.form.placeholders.branch
                            : text.form.placeholders.branchNoProvider
                        }
                        error={fieldState.error?.message as string | undefined}
                        options={branchOptions}
                        value={field.value ?? null}
                        onChange={(option) => field.onChange(option ?? null)}
                        isDisabled={isBranchDisabled || quotationMutation.isPending}
                        loading={providerDetailQuery.isFetching}
                        disablePortal
                      />
                    )}
                  />

                  {/* FIELD-03 — requires_file, required, Select "Sim/Não"
                      (widget legado, não checkbox — ver schema). */}
                  <Controller
                    name="requires_file"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Select
                        name={field.name}
                        label={text.form.fields.requiresFile}
                        error={fieldState.error?.message as string | undefined}
                        options={requestQuotationRequiresFileOptions.options(languageGB)}
                        value={field.value ?? null}
                        onChange={(option) => field.onChange(option ?? null)}
                        isRequired
                        noClearable
                        isDisabled={isRequiresFileDisabled || quotationMutation.isPending}
                        disablePortal
                      />
                    )}
                  />
                </SimpleGrid>

                <SimpleGrid columns={1} gap={4} mt={4}>
                  {/* FIELD-04 — note, opcional, sem `.max()` (coluna
                      `longText`, ver schema). */}
                  <Textarea
                    label={text.form.fields.note}
                    placeholder={text.form.placeholders.note}
                    {...register('note')}
                    error={errors.note?.message}
                    disabled={quotationMutation.isPending}
                  />
                </SimpleGrid>

                {/* P04 — quadro "Sobre o fornecedor" (legado `#data_provider`). */}
                {providerUuid && (
                  <Box mt={6} aria-live="polite">
                    {providerDetailQuery.isLoading ? (
                      <Skeleton height="120px" borderRadius="md" aria-label={boardText.loading} />
                    ) : providerDetailQuery.isError ? (
                      <Text fontSize="sm" color="fg.error">
                        {boardText.loadError}
                      </Text>
                    ) : (
                      <Table.Root size="sm" variant="outline" aria-label={boardText.title}>
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader colSpan={2}>{boardText.title}</Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {providerBoard.map((row) => (
                            <Table.Row key={row.field}>
                              <Table.Cell fontWeight="medium" width="35%">
                                {boardText[row.field]}:
                              </Table.Cell>
                              <Table.Cell>{row.value || '—'}</Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    )}
                  </Box>
                )}
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  title={languageGB.defaltStrings.cancel}
                  variant="secondary"
                  type="button"
                  onClick={handleClose}
                  disabled={quotationMutation.isPending}
                />
                <Button
                  title={
                    isEditing ? languageGB.defaltStrings.update : languageGB.defaltStrings.create
                  }
                  type="submit"
                  loading={quotationMutation.isPending}
                />
              </Dialog.Footer>
            </Form>

            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
