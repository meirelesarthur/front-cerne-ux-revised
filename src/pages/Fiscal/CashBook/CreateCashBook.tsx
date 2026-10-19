// src/pages/Fiscal/CashBook/CreateCashBook.tsx
// -----------------------------------------------------------------------------
// Tela CREATE-ONLY de CashBook (LCDPR — Livro Caixa Digital do Produtor
// Rural, domínio Fiscal, execução 045, TASK-LCDPR-FE-03). Não existe modo de
// edição (`RT-NA-EDIT`) — sem branch `isEditing`/`update`.
//
// **Mandato de fidelidade do dono (inviolável):** os 8 campos e seus
// comportamentos (cascata `special`→`dt_special` com guarda `dirtyFields`,
// validações de data, selects estáticos de Proprietário/Contador) são fiéis
// ao `CONTRATO-FRONT-LCDPR.md §4` — rótulos dos 3 enums citados literalmente
// do Blade legado, copiados exatamente nas fábricas de options
// (`src/constants/fiscal/cashBook/cash-book-*.ts`).
//
// Casca: `FormContainer` com `footer` opt-in (Cancelar + submit externo via
// `form="cashBook-form"`), mirror `get_pwa_form_query_pattern`.
// -----------------------------------------------------------------------------

import { SimpleGrid } from '@chakra-ui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { todayLocalDate } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { cashBookPeriodOptions } from '@/constants/Fiscal/cashBook/cash-book-period';
import { cashBookSpecialOptions } from '@/constants/Fiscal/cashBook/cash-book-special';
import { cashBookVerificationOptions } from '@/constants/Fiscal/cashBook/cash-book-verification';

import cashBookSchemaResolver from '@/validations/schemas/CashBook/cashBook-schema';

import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listContadorOptions } from '@/services/v2/Contadores/contador-service';
import { createCashBook } from '@/services/v2/Fiscal/CashBook/cash-book-service';

import type {
  CashBookForm,
  CashBookProprietaryOption,
  CashBookSpecial,
} from '@/@types/v2/Fiscal/cashBook';

// Limites de data (UT-000777, D2): ano mínimo 2000; fim = ontem (a API exige
// end_date < hoje). Espelha `CashBookRequest` e o schema.
const MIN_DATE = new Date(2000, 0, 1);

function isoToLocalDate(iso: string | null | undefined): Date | undefined {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return undefined;
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function yesterdayLocalDate(): Date {
  const date = todayLocalDate();
  date.setDate(date.getDate() - 1);
  return date;
}

const pristineFormValues: CashBookForm = {
  start_date: null,
  end_date: null,
  proprietary_id: null,
  period: null,
  special: null,
  dt_special: null,
  verification: null,
  contador_id: null,
};

export default function CreateCashBook() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const text = languageGB.cashBooks.cashBook;

  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CashBookForm>({
    mode: 'onChange',
    resolver: cashBookSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: pristineFormValues,
  });

  // ---- Lookups estáticos, carregados UMA VEZ (§3 do contrato — NUNCA AJAX) --
  const proprietaryOptionsQuery = useQuery({
    queryKey: ['cash-book-create-proprietary-options'],
    queryFn: () => listProprietaryOptions(undefined, 'farm'),
    staleTime: 30 * 1000,
  });
  // UT-000785 (D1/D5): proprietário sem CPF válido (CNPJ, CPF inválido ou sem
  // documento) fica visível porém DESABILITADO, com o motivo no próprio rótulo.
  // `Select` local é Chakra (sem `isOptionDisabled`): usa `Option.disabled`.
  const proprietaryOptions: CashBookProprietaryOption[] = (proprietaryOptionsQuery.data ?? []).map(
    (item) => {
      const blocked = item.cpf_valid === false;
      return {
        label: blocked
          ? `${item.label} — ${text.form.validation.proprietaryCpfRequired}`
          : item.label,
        value: item.uuid,
        disabled: blocked,
        document_type: item.document_type,
        cpf_valid: item.cpf_valid,
      };
    }
  );

  const contadorOptionsQuery = useQuery({
    queryKey: ['cash-book-create-contador-options'],
    queryFn: () => listContadorOptions(),
    staleTime: 30 * 1000,
  });
  const contadorOptions = (contadorOptionsQuery.data ?? []).map((item) => ({
    label: item.label,
    value: item.uuid,
  }));

  const periodOptions = cashBookPeriodOptions.options();
  const specialOptions = cashBookSpecialOptions.options();
  const verificationOptions = cashBookVerificationOptions.options();

  // ---- Cascata special → dt_special (CONTRATO-FRONT-LCDPR.md §4.2) --------
  const watchSpecial = watch('special');
  const watchStartDate = watch('start_date');
  const watchEndDate = watch('end_date');

  // ---- Limites dos DateInput (UT-000777) ----------------------------------
  const yesterday = yesterdayLocalDate();
  const startDateObj = isoToLocalDate(watchStartDate);
  const endDateMin = startDateObj && startDateObj > MIN_DATE ? startDateObj : MIN_DATE;
  const endDateObj = isoToLocalDate(watchEndDate);
  const startYearEnd = startDateObj ? new Date(startDateObj.getFullYear(), 11, 31) : undefined;
  const dtSpecialMax =
    endDateObj ?? (startYearEnd && startYearEnd < yesterday ? startYearEnd : yesterday);
  const dtSpecialReadOnly = !watchSpecial || watchSpecial.value === 0;
  const dtSpecialRequired = !!watchSpecial && watchSpecial.value > 0;

  const createMutation = useMutation({
    mutationFn: createCashBook,
    onSuccess: (response) => {
      toaster.success({ title: text.singularLabel, description: text.form.createSuccess });
      navigate('/fiscal/livro-caixa/' + response.data.uuid);
    },
    onError: (error) => {
      // UT-000785: 422 por campo `errors.proprietary_id` (proprietário sem CPF
      // válido) vai na legenda do campo, além do toast com a mesma mensagem da
      // API. A regra de negócio de contas sem banco identificável chega como
      // `message` (sem `errors` por campo) e cai no toast abaixo, sem texto técnico.
      const proprietaryFieldError = isAxiosError(error)
        ? (error.response?.data as { errors?: { proprietary_id?: string[] | string } } | undefined)
            ?.errors?.proprietary_id
        : undefined;
      const proprietaryMessage = Array.isArray(proprietaryFieldError)
        ? proprietaryFieldError[0]
        : proprietaryFieldError;
      if (typeof proprietaryMessage === 'string' && proprietaryMessage) {
        setError('proprietary_id', { type: 'server', message: proprietaryMessage });
      }
      // Duplicidade (`BusinessRuleException`, 422 SEM `errors` por campo —
      // `AD-03` do contrato de API) aparece como erro GERAL, mensagem
      // idêntica à devolvida pelo backend (`extractApiErrorMessage` lê
      // `resData.message` sem prefixo, ao contrário de `useRequest`).
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) || text.form.createGenericError,
        duration: 7000,
      });
    },
  });

  function tryPersistCashBook(data: CashBookForm) {
    if (
      !data.start_date ||
      !data.end_date ||
      !data.proprietary_id ||
      !data.period ||
      !data.special ||
      !data.verification ||
      !data.contador_id
    ) {
      return;
    }

    createMutation.mutate({
      start_date: data.start_date,
      end_date: data.end_date,
      proprietary_id: data.proprietary_id.value,
      period: data.period.value,
      special: data.special.value,
      dt_special: data.dt_special,
      verification: data.verification.value,
      contador_id: data.contador_id.value,
    });
  }

  // ITEM-LCDPR-UT-000187 (lote-2) — AF_REJECTED: clicar em "Salvar" com um
  // campo client-side inválido (ex.: `end_date` violando a regra `CL-09`,
  // "não pode ser hoje ou futuro", `CashBookRequest.php` §backend) fazia
  // `handleSubmit` bloquear o submit em SILÊNCIO — nenhuma requisição,
  // nenhuma mensagem — o `errorText` inline do `Field` some no meio de 8
  // campos numa grid de 3 colunas e passa despercebido. Guarda `onInvalid`
  // mirror `CreateOrUpdateContrato.tsx`/`CreateOrUpdateNfe.tsx` (padrão já em
  // produção): toast com a mensagem REAL do 1º erro, já localizada pelo Yup —
  // garante que ALGO sempre aparece na tela ao clicar Salvar com dado
  // inválido, mesmo quando o campo com erro não está visível.
  function onInvalid(formErrors: FieldErrors<CashBookForm>) {
    const firstErrorMessage = Object.values(formErrors).find(
      (fieldError): fieldError is { message?: string } =>
        !!fieldError && typeof fieldError === 'object' && 'message' in fieldError
    )?.message;

    toaster.error({
      title: text.singularLabel,
      description: firstErrorMessage || text.form.createGenericError,
      duration: 7000,
    });
  }

  return (
    <FormContainer
      title={text.form.pageTitle}
      subtitle={text.form.pageSubtitle}
      footer={
        <>
          <Button
            title={text.form.cancelButton}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          <ButtonSaveAndNext
            form="cashBook-form"
            type="submit"
            create
            dirtyFields={{}}
            languageGB={languageGB}
            loading={isSubmitting || createMutation.isPending}
          />
        </>
      }
    >
      <Form id="cashBook-form" onSubmit={handleSubmit(tryPersistCashBook, onInvalid)}>
        <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
          {/* 1. start_date */}
          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field
                label={text.form.fields.startDate}
                isRequired
                errorText={errors.start_date?.message as string}
              >
                <DateInput
                  value={value}
                  onChange={onChange}
                  minDate={MIN_DATE}
                  maxDate={yesterday}
                />
              </Field>
            )}
          />

          {/* 2. end_date — 3 validações client-side já no schema (TASK-LCDPR-FE-01) */}
          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field
                label={text.form.fields.endDate}
                isRequired
                errorText={errors.end_date?.message as string}
              >
                <DateInput
                  value={value}
                  onChange={(next) => {
                    onChange(next);
                    // dt_special depende de end_date (cross-field): revalida.
                    if (watch('dt_special')) setTimeout(() => trigger('dt_special'), 0);
                  }}
                  minDate={endDateMin}
                  maxDate={yesterday}
                />
              </Field>
            )}
          />

          {/* 3. proprietary_id — Select estático, carregado UMA VEZ */}
          <Controller
            name="proprietary_id"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.form.fields.proprietary}
                placeholder={text.form.fields.proprietaryPlaceholder}
                name={name}
                value={value}
                onChange={onChange}
                options={proprietaryOptions}
                loading={proprietaryOptionsQuery.isLoading}
                isRequired
                error={errors.proprietary_id?.message as string}
              />
            )}
          />

          {/* 4. period — Select estático, 3 opções */}
          <Controller
            name="period"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.form.fields.period}
                placeholder={text.form.fields.periodPlaceholder}
                name={name}
                value={value}
                onChange={onChange}
                options={periodOptions}
                isRequired
                error={errors.period?.message as string}
              />
            )}
          />

          {/* 5. special — onChange limpa dt_special ANTES de propagar
              (CONTRATO-FRONT-LCDPR.md §4.2, citação literal) */}
          <Controller
            name="special"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.form.fields.special}
                placeholder={text.form.fields.specialPlaceholder}
                name={name}
                value={value}
                onChange={(option: { value: CashBookSpecial; label: string } | null) => {
                  // Limpeza explícita da ação do usuário — NÃO é reset() de
                  // fillForm, não viola Lei 2 (guarda de dirtyFields é para
                  // hidratação por query; aqui é reação direta ao input do
                  // próprio usuário neste mesmo campo).
                  setValue('dt_special', null, { shouldDirty: true, shouldValidate: true });
                  onChange(option);
                }}
                options={specialOptions}
                isRequired
                error={errors.special?.message as string}
              />
            )}
          />

          {/* 6. dt_special — disabled quando special vazio/0; obrigatório
              client-side quando special > 0 (via .when() do schema) */}
          <Controller
            name="dt_special"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field
                label={text.form.fields.dtSpecial}
                isRequired={dtSpecialRequired}
                errorText={errors.dt_special?.message as string}
              >
                <DateInput
                  value={value}
                  onChange={onChange}
                  disabled={dtSpecialReadOnly}
                  minDate={MIN_DATE}
                  maxDate={dtSpecialMax}
                />
              </Field>
            )}
          />

          {/* 7. verification — Select estático, 2 opções */}
          <Controller
            name="verification"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.form.fields.verification}
                placeholder={text.form.fields.verificationPlaceholder}
                name={name}
                value={value}
                onChange={onChange}
                options={verificationOptions}
                isRequired
                error={errors.verification?.message as string}
              />
            )}
          />

          {/* 8. contador_id — Select estático, carregado UMA VEZ */}
          <Controller
            name="contador_id"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.form.fields.contador}
                placeholder={text.form.fields.contadorPlaceholder}
                name={name}
                value={value}
                onChange={onChange}
                options={contadorOptions}
                loading={contadorOptionsQuery.isLoading}
                isRequired
                error={errors.contador_id?.message as string}
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
