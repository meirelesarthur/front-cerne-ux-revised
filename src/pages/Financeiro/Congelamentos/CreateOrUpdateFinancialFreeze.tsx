// src/pages/Financeiro/Congelamentos/CreateOrUpdateFinancialFreeze.tsx
// -----------------------------------------------------------------------------
// Formulário único de CRIAÇÃO, EDIÇÃO e VISUALIZAÇÃO read-only de Congelamento
// Financeiro (FinancialFreeze — F-110, esteira 97-Esteiras/008, Tarefa 32).
// Mirror estrutural de `Financeiro/ContasAPagar/CreateOrUpdateExpense.tsx`
// (MESMO módulo): padrão do modo read-only por rota (`isViewOnlyRoute`), guard
// de uuid malformado, footer Cancelar/Salvar/Excluir, mapeamento de 422 por
// campo. Casca (`FormContainer`+footer+`<Form id>`+submit externo) mirror
// `Financeiro/Conciliacao/ImportacaoOfx/CreateOrUpdateOfxImport.tsx`. Guard de
// submit sem alteração mirror `Administrativo/Eventos/CreateOrUpdateEvento.tsx`.
//
// 3 rotas apontam para este MESMO componente (`src/router/index.tsx`):
//   /financeiro/congelamentos/novo                             (financial-freeze_create)
//   /financeiro/congelamentos/:financialFreezeUuid              (financial-freeze_edit)
//   /financeiro/congelamentos/:financialFreezeUuid/visualizar   (financial-freeze_view)
//
// Armadilhas confirmadas (contrato de tela §6/§10, Tarefa 32 — não redescobrir):
//   1. `POST` NÃO devolve `movements` — o histórico nunca é montado a partir
//      da resposta de criação, só do `GET /{uuid}` (`actionSuccess` abaixo
//      redireciona para a rota de EDIÇÃO do uuid recém-criado por isso).
//   2. `is_frozen: false` é um valor VÁLIDO — ver
//      `@/validations/schemas/FinancialFreeze/financial-freeze-schema`.
//   3. `/novo` está declarada ANTES de `/:financialFreezeUuid` no router.
//   4. `year` é string — nunca convertido para number no payload.
//   5. FF-N1 ("O mês e ano não pode ser superior ao mês atual.") chega no
//      campo `month`, não em `year` nem em toast solto.
//   6. `FormContainer` do fork NÃO tem prop `fullHeight`.
//   7. Guard de submit sem alteração usa `Object.keys(dirtyFields).length ===
//      0` — a semântica de `isEmpty` do fork é invertida ao nome.
//   8. Efeito real: salvar `is_frozen: true` bloqueia lançamentos financeiros
//      de verdade em 13 pontos do backend (descongelar ao testar).
//
// GAP-FF-FE-01 (pré-validação client de mês futuro) — default AS-IS aplicado
// nesta Tarefa: NÃO implementada aqui, ver comentário no schema.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { SimpleGrid, Skeleton, useDisclosure } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { FormSection } from '@/components/FormSection';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { financialFreezeMonthOptions } from '@/constants/Financial/FinancialFreeze/options/financial-freeze-month-options';
import { boolean as booleanOptions } from '@/constants/options/boolean';
import { queryKey } from '@/constants/query-key';

import { financialFreezeSchemaResolver } from '@/validations/schemas/FinancialFreeze/financial-freeze-schema';

import {
  createFinancialFreeze,
  deleteFinancialFreeze,
  getFinancialFreeze,
  updateFinancialFreeze,
} from '@/services/v2/FinancialFreeze/financial-freeze-service';

import type {
  FinancialFreezeDetail,
  FinancialFreezeForm as FinancialFreezeFormType,
  FinancialFreezePayload,
} from '@/@types/v2/FinancialFreeze';

import { FinancialFreezeMovementHistory } from './FinancialFreezeMovementHistory';

// Campos que o form conhece — 422 fora deste conjunto é ignorado (mirror
// `applyServerFieldErrors`/`tryPersistEvento`). `user_id`/`tenant_id` nunca
// existem no form, então nunca aparecem aqui (proibidos no payload).
const KNOWN_FIELDS = new Set(['month', 'year', 'is_frozen']);

export default function CreateOrUpdateFinancialFreeze() {
  const { financialFreezeUuid } = useParams<{ financialFreezeUuid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.financial.financialFreeze;
  const formText = text.form;

  // Rota "/visualizar" reaproveita o MESMO componente, forçada
  // somente-leitura independente de o usuário também ter `financial-freeze_edit`
  // (mirror `CreateOrUpdateExpense.tsx:255`).
  const isViewOnlyRoute = location.pathname.endsWith('/visualizar');
  const isEditing = isValidGuid(financialFreezeUuid);

  // Guard de uuid malformado — a rota TEM parâmetro mas ele não é um GUID
  // válido (mirror `CreateOrUpdateExpense.tsx`, armadilha #3).
  useEffect(() => {
    if (financialFreezeUuid && !isValidGuid(financialFreezeUuid)) {
      navigate('/financeiro/congelamentos', { replace: true });
    }
  }, [financialFreezeUuid, navigate]);

  const canSave =
    !isViewOnlyRoute && (isEditing ? can('financial-freeze_edit') : can('financial-freeze_create'));
  // Excluir — só no modo editar (nunca em visualizar, mirror da Leitura do
  // dev da Tarefa 32 §7), gate próprio `financial-freeze_delete`.
  const canDelete = isEditing && !isViewOnlyRoute && can('financial-freeze_delete');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<FinancialFreezeFormType>({
    mode: 'onChange',
    resolver: financialFreezeSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      // Defaults do criar (contrato de tela §6, mirror do legado): mês
      // corrente, ano corrente, Congelado? = Sim.
      month: financialFreezeMonthOptions.getOption(new Date().getMonth() + 1, languageGB),
      year: String(new Date().getFullYear()),
      is_frozen: booleanOptions.getOption(true, languageGB),
    },
  });

  // Lei 2 — função NOMEADA com guarda de dirtyFields, `reset()` só aqui
  // dentro (nunca em `useEffect` inline). `isEmpty` do fork tem semântica
  // INVERTIDA ao nome (retorna `true` quando HÁ chaves) — a forma canônica
  // do repo é `!isEmpty(dirtyFields) || resetForce`.
  function fillFinancialFreezeForm(data: FinancialFreezeDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        month: financialFreezeMonthOptions.getOption(data.month, languageGB),
        year: data.year,
        is_frozen: booleanOptions.getOption(data.is_frozen, languageGB),
      });
    }
  }

  const financialFreezeQuery = useCustomFormQueryByGuid<FinancialFreezeDetail>({
    registrationId: isEditing ? financialFreezeUuid : undefined,
    asyncFunction: getFinancialFreeze,
    queryKey: queryKey.financial.financialFreeze,
    fillForm: fillFinancialFreezeForm,
  });

  const isLoading = isEditing && checkLoadingStatus([financialFreezeQuery as any]);
  const financialFreezeData = (financialFreezeQuery as any)?.data as
    FinancialFreezeDetail | undefined;

  async function tryPersistFinancialFreeze(data: FinancialFreezeFormType) {
    const payload: FinancialFreezePayload = {
      month: data.month!.value,
      year: data.year,
      is_frozen: data.is_frozen!.value,
    };

    try {
      return isEditing && financialFreezeUuid
        ? await updateFinancialFreeze(financialFreezeUuid, payload)
        : await createFinancialFreeze(payload);
    } catch (error) {
      // 422 por campo — inclui FF-N1 ("O mês e ano não pode ser superior ao
      // mês atual."), que chega no campo `month` (armadilha #5). O `throw`
      // preserva o toast genérico que `useRequest` já mostra (mirror
      // `tryPersistEvento`).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0] && KNOWN_FIELDS.has(field)) {
            setError(field as keyof FinancialFreezeFormType, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  const financialFreezeMutation = useRequest({
    asyncFunction: tryPersistFinancialFreeze,
    entityName: text.singularLabel,
    queryKey: queryKey.financial.financialFreezes,
    queryKey2: queryKey.financial.financialFreeze,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: (data) => {
      // Criar: navega para a rota de EDIÇÃO do uuid retornado — só assim o
      // `GET /{uuid}` (único verbo que traz `movements`) hidrata o
      // histórico com o 1º movimento (armadilha #1). Editar: volta.
      if (isEditing) {
        navigate(-1);
      } else {
        navigate(`/financeiro/congelamentos/${data.uuid}`, { replace: true });
      }
    },
  });

  async function onSubmit(data: FinancialFreezeFormType) {
    // Guard de submit sem alteração — forma EXPLÍCITA
    // `Object.keys(dirtyFields).length === 0` (armadilha #7, NUNCA `isEmpty`
    // direto aqui — a semântica invertida engana).
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await financialFreezeMutation.mutateAsync(data);
  }

  const isSubmitting = financialFreezeMutation.isPending;

  const deleteDisclosure = useDisclosure();
  const deleteMutation = useRequest({
    asyncFunction: async () => {
      return await deleteFinancialFreeze(financialFreezeUuid!);
    },
    entityName: text.singularLabel,
    queryKey: queryKey.financial.financialFreezes,
    queryKey2: queryKey.financial.financialFreeze,
    typesRequest: 'update',
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      deleteDisclosure.onClose();
      navigate('/financeiro/congelamentos');
    },
  });

  const formTitle = isViewOnlyRoute
    ? formText.title.view
    : isEditing
      ? formText.title.edit
      : formText.title.create;

  // Histórico (Tarefa 32 §8) — `FormSection` na MESMA tela (não é aba,
  // decisão FID-G3F §3 superfície 7), visível em editar E visualizar. Sem
  // query própria — o array vem do `GET /{uuid}` já carregado pela query do
  // formulário; NUNCA montado a partir da resposta do `POST` (armadilha #1).
  const showHistorySection = isEditing || isViewOnlyRoute;

  return (
    <>
      <FormContainer
        title={formTitle}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="outline"
              type="button"
              onClick={() => navigate(-1)}
            />
            {canDelete && (
              <Button
                title={languageGB.defaltStrings.delete}
                variant="outline"
                colorPalette="red"
                type="button"
                onClick={deleteDisclosure.onOpen}
              />
            )}
            {canSave && (
              <ButtonSaveAndNext
                type="submit"
                form="financial-freeze-form"
                create={!isEditing}
                dirtyFields={dirtyFields}
                languageGB={languageGB}
                loading={isSubmitting}
                disabled={isSubmitting || isLoading}
              />
            )}
          </>
        }
      >
        <Form id="financial-freeze-form" noPadding onSubmit={handleSubmit(onSubmit)}>
          <SimpleGrid columns={columnsForm.default} gap={6} mb={showHistorySection ? '6' : '0'}>
            <Controller
              name="month"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Select
                  name={field.name}
                  label={formText.fields.month}
                  // 12 opções SEMPRE — não esconder/desabilitar meses futuros
                  // (GAP-FF-FE-01, as-is).
                  options={financialFreezeMonthOptions.options(languageGB)}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                  loading={isLoading}
                  noClearable
                />
              )}
            />

            <Input
              label={formText.fields.year}
              maxLength={4}
              inputMode="numeric"
              {...register('year')}
              error={errors.year?.message}
              isRequired
              loading={isLoading}
              disabled={!canSave}
            />

            <Controller
              name="is_frozen"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Select
                  name={field.name}
                  label={formText.fields.isFrozen}
                  options={booleanOptions.options(languageGB)}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                  loading={isLoading}
                  noClearable
                />
              )}
            />
          </SimpleGrid>

          {showHistorySection && (
            <FormSection title={formText.historySection.title} columns={1}>
              <Skeleton loading={isLoading} borderRadius="lg">
                <FinancialFreezeMovementHistory movements={financialFreezeData?.movements ?? []} />
              </Skeleton>
            </FormSection>
          )}
        </Form>
      </FormContainer>

      {canDelete && (
        <DeleteConfirmDialog
          isOpen={deleteDisclosure.open}
          onClose={deleteDisclosure.onClose}
          onConfirm={() => deleteMutation.mutate(undefined)}
          isLoading={deleteMutation.isPending}
          itemName={
            financialFreezeData
              ? `${financialFreezeMonthOptions.getLabel(financialFreezeData.month, languageGB)}/${financialFreezeData.year}`
              : undefined
          }
          tone="danger"
        />
      )}
    </>
  );
}
