// src/pages/BaseRegistrations/PaymentTerms/CreateOrUpdatePaymentTerms.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de CONDIÇÃO DE PAGAMENTO (PaymentTerm) —
// Cadastros Base / Financeiros. Rotas: /cadastros-base/condicoes-pagamento/novo
// e /cadastros-base/condicoes-pagamento/:paymentTermId (GUID), registradas em
// src/router/index.tsx, guardadas por `paymentterms_view` (os paths NÃO mudam
// na migração modular).
//
// Padrão modular (mirror de
// BaseRegistrations/DiagnosisPregnancy/CreateOrUpdateDiagnosisPregnancy.tsx):
// `isEditing` por GUID, `fillForm` guardado por `!isEmpty(dirtyFields) ||
// resetForce`, `useCustomFormQueryByGuid` INLINE (sem hook wrapper), mutação
// via `useRequest` com `typesRequest` condicional, `ButtonSaveAndNext` com
// `dirtyFields`.
//
// 5 campos, TODOS obrigatórios em AMBOS os verbos (PaymentTermRequest::rules()
// não distingue store/update — full-resource-replace, contrato §12):
//   - `description` (Input, obrigatório, máx. 100, sem unicidade)
//   - `condition` (Input de TEXTO LIVRE — NÃO InputMask, lista de dias de
//     comprimento variável, validado por regex `^\d+(,\d+)*$`)
//   - `type` (Select ESTÁTICO — Compra/Venda/Ambos)
//   - `is_enabled` (Select Ativo/Inativo)
//   - `out_day` (Select Sim/Não — migrado como está, D3 do contrato, sem
//     semântica de negócio conhecida)
//
// ⚠️ ARMADILHA CENTRAL — `type` é SLUG STRING, NÃO enum int. O
// PaymentTermResource/PaymentTermRequest trabalham com a SLUG diretamente
// ('compra'|'venda'|'ambos', contrato §6/§13) — o <Select> do RHF guarda a
// MESMA string que vai ao payload, SEM nenhuma conversão numérica.
//
// ⚠️ `onSubmit`/`fillForm`: `src/utils/isEmpty.ts` é MAL NOMEADA — retorna
// `true` quando o objeto TEM chaves (NÃO vazio) e `false` quando está vazio.
// A guarda de `onSubmit` abaixo usa o comportamento REAL: `isEditing &&
// isEmpty(dirtyFields)` → dirtyFields TEM chaves → houve alteração real →
// salva. `isEditing` sem isso → dirtyFields vazio → nada mudou → só navega.
// Criação → sempre salva.
//
// Payload de escrita SEMPRE completo (POST e PUT) — `PaymentTermRequest`
// exige os 5 campos também no update (sem bloco condicional por verbo),
// nunca gated por `dirtyFields`.
// -----------------------------------------------------------------------------

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { paymentTermsSchemaResolver } from '@/validations/schemas/BaseRegistrations/paymentTerms-schema';

import {
  createPaymentTerm,
  getPaymentTermByUuid,
  updatePaymentTerm,
} from '@/services/v2/BaseRegistrations/paymentTerms-service';

import type { Option } from '@/@types/option';
import type {
  PaymentTermDetail,
  PaymentTermForm as PaymentTermFormType,
  PaymentTermPayload,
} from '@/@types/v2/BaseRegistrations/paymentTerms';

export default function CreateOrUpdatePaymentTerms() {
  const { paymentTermId } = useParams<{ paymentTermId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(paymentTermId);

  const text = languageGB.baseRegistrations.paymentTerm;

  const canSave = isEditing ? can('paymentterms_edit') : can('paymentterms_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<PaymentTermFormType>({
    mode: 'onChange',
    resolver: paymentTermsSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      condition: '',
      type: '',
      is_enabled: true,
      out_day: false,
    },
  });

  // Lei 2 (`get_pwa_form_query_pattern`) — guarda por `!isEmpty(dirtyFields) ||
  // resetForce`. Com a semântica REAL de `isEmpty` (true quando TEM chaves),
  // `!isEmpty(dirtyFields)` é `true` quando `dirtyFields` está VAZIO (nada
  // editado ainda) — reset() só roda quando é seguro (sem edição em
  // andamento) ou quando forçado pela carga inicial do hook
  // (`resetForce=true`).
  function fillForm(data: PaymentTermDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        // `type` é SLUG STRING — vai DIRETO ao form, SEM String(Number(...))
        // nem qualquer conversão.
        condition: data.condition,
        type: data.type,
        is_enabled: !!data.is_enabled,
        out_day: !!data.out_day,
      });
    }
  }

  const paymentTermQuery = useCustomFormQueryByGuid<PaymentTermDetail>({
    registrationId: isEditing ? paymentTermId : undefined,
    queryKey: queryKey.baseRegistrations.paymentTerm,
    asyncFunction: getPaymentTermByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([paymentTermQuery as any]);

  const paymentTermMutation = useRequest({
    asyncFunction: tryPersistPaymentTerm,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.paymentTerms,
    queryKey2: queryKey.baseRegistrations.paymentTerm,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistPaymentTerm(data: PaymentTermFormType) {
    // UPDATE e CREATE enviam o MESMO conjunto completo — `PaymentTermRequest`
    // (api_root) exige os 5 campos também no update (sem bloco condicional
    // por verbo), então NUNCA podem ser gated por `dirtyFields`. `type` vai
    // como a MESMA slug string do form, SEM Number(...) (armadilha central
    // desta tela — ver cabeçalho do arquivo).
    const payload: PaymentTermPayload = {
      description: data.description.trim(),
      condition: data.condition.trim(),
      type: data.type as PaymentTermPayload['type'],
      is_enabled: !!data.is_enabled,
      out_day: !!data.out_day,
    };

    if (isEditing && paymentTermId) {
      return await updatePaymentTerm(paymentTermId, payload);
    }

    return await createPaymentTerm(payload);
  }

  async function onSubmit(data: PaymentTermFormType) {
    if (isEditing && isEmpty(dirtyFields)) {
      // dirtyFields TEM chaves (isEmpty real === true) → houve alteração → salva.
      await paymentTermMutation.mutateAsync(data);
    } else if (isEditing) {
      // dirtyFields VAZIO (isEmpty real === false) → nada mudou → só volta, sem PUT.
      navigate(-1);
    } else {
      // Criação → sempre salva.
      await paymentTermMutation.mutateAsync(data);
    }
  }

  const isSubmitting = paymentTermMutation.isPending;

  // Reaproveita os textos já existentes da listagem (Ativo/Inativo) — mesmo
  // racional de CreateOrUpdateDiagnosisPregnancy.tsx (evita duplicar chave de
  // i18n para o mesmo par de rótulos).
  const enabledOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.active },
    { value: false, label: text.list.table.inactive },
  ];

  // `type` — VALUE = SLUG (não índice), fiel ao contrato §6/§13.
  const typeOptions: Option<string>[] = [
    { value: 'compra', label: text.form.typeOptions.purchase },
    { value: 'venda', label: text.form.typeOptions.sale },
    { value: 'ambos', label: text.form.typeOptions.both },
  ];

  // `out_day` — Select Sim/Não, migrado como está (D3), sem tooltip especial.
  const outDayOptions: Option<boolean>[] = [
    { value: true, label: text.form.outDayOptions.yes },
    { value: false, label: text.form.outDayOptions.no },
  ];

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          {/* `condition` — Input de TEXTO LIVRE, NÃO InputMask (lista de dias
              de comprimento variável, ex. "10,20,30"); validado por regex no
              schema Yup, mensagem fiel ao legado. */}
          <Input
            label={text.form.fields.condition}
            placeholder={text.form.placeholders.condition}
            {...register('condition')}
            error={errors.condition?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.type}
                name={name}
                // ⚠️ ARMADILHA — value NUNCA undefined (necessário para o
                // botão "Limpar" conseguir zerar o campo).
                value={typeOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<string> | null) => onChange(opt?.value ?? '')}
                options={typeOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.isEnabled}
                name={name}
                value={enabledOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={enabledOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="out_day"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.outDay}
                name={name}
                value={outDayOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={outDayOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
