// src/pages/Administrativo/Adiantamento/CreateOrUpdateAdiantamento.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de ADIANTAMENTO SALARIAL — Administrativo.
// TASK-FE-adiant-salarial (97-Esteiras/034). Rotas: /administrativo/
// adiantamento/novo (create, guarda `advances_create` no botão) e
// /administrativo/adiantamento/:advanceUuid (edit, guarda `advances_edit`).
//
// Mirror ESTRUTURAL de `CadastrosBase/CicloProducao/CreateOrUpdateCicloProducao.tsx`:
// um único `useForm`, `isEditing = isValidGuid(advanceUuid)`, `fillForm`
// nomeada com guarda de `dirtyFields` (Lei 2), `useRequest` para a mutação.
//
// UX-GAP declarado (FID-G3F §1): sem tela desenhada no `ux_root` — decisão
// do dono = seguir-pelo-padrão.
//
// ---- De-para dos 2 selects relacionais (employee/event) ----
// Mesmo racional de `CreateOrUpdateCicloProducao.tsx`: `AdvanceForm` guarda
// só o uuid CRU (`string`), e um estado local "picked option"
// (`useState<Option | null>`) guarda o par {label,value} para EXIBIÇÃO —
// semeado por `fillForm` a partir da relação já resolvida pelo `show`
// (`employee`/`event`), e atualizado no `onChange` de cada Select quando o
// usuário escolhe outra opção.
//   - employee_uuid → `SelectAsyncPaginate service={listEmployees}` (tenant-
//     scoped, `X-Farm-Id`).
//   - event_uuid     → `SelectAsyncPaginate service={listEvents}` — SEM
//     filtro de tipo (default FID-G3F §6.2, D1 do dono: fiel ao legado, que
//     não restringia tipo server-side).
//
// ---- FE-FORM-MODE (update = full-replace) ----
// `tryPersistAdvance` SEMPRE envia os 5 campos completos, tanto em create
// quanto em update — NUNCA um patch parcial por `dirtyFields` (diverge
// conscientemente de `CreateOrUpdateCicloProducao.tsx`, que usa PATCH
// parcial; aqui o acoplamento amount↔installments torna isso inconsistente
// por construção, decisão de arquitetura §4.3 da FID-G3A).
//
// ---- 422 por campo (FE-FORM-422) ----
// `tryPersistAdvance` mapeia `error.response.data.errors → setError`
// LOCALMENTE (mesmo padrão de `tryPersistProductionCycle`) — em especial a
// chave `installments` (invariante Σ==amount), lida pelo array-level error
// text do `InstallmentsFieldArray`. O toast genérico de `useRequest` cobre a
// `message` de nível superior.
//
// `code`/`farm_id`/criador NUNCA são campos do form — Advance não tem
// `code`; `farm_id` é server-derived (R4).
//
// ---- Bloco financeiro (D2-REV) — EDIT reidrata COMPLETO (GAP-ADV-02) ----
// `fillForm` delega a `hydrateFinancialFromResource` (`advance-financial-
// hydrate.ts`): header (type/provider/proprietary/number/note/
// fiscal_document) + installments + categories vêm 1:1 de `advance.
// financial.*` (a `AdvanceResource` ecoa tudo isso, confirmado no código
// real). SÓ `has_input`/`input_date`/`input_value` ficam neutros — nunca
// persistidos (write-only, só o gerador da criação usa).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { advanceSchemaResolver } from '@/validations/schemas/Advances/advance-schema';

import { createAdvance, updateAdvance } from '@/services/v2/Advances/advance-service';
import { listEmployees } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listEvents } from '@/services/v2/Events/event-service';

import type { Option } from '@/@types/option';
import type { Advance, AdvanceForm as AdvanceFormType, AdvancePayload } from '@/@types/v2/Advances';
import type { EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';
import type { EventListItem } from '@/@types/v2/Events';

import { hydrateFinancialFromResource } from './advance-financial-hydrate';
import { FinancialBlock } from './FinancialBlock';
import { InstallmentsFieldArray } from './InstallmentsFieldArray';
import { useAdvanceForm } from './useAdvances';

const ADVANCES_LIST_ROUTE = '/administrativo/adiantamento';

export default function CreateOrUpdateAdiantamento() {
  const { advanceUuid } = useParams<{ advanceUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // `/novo` NÃO tem `:advanceUuid` (rota própria, sem param); só a rota
  // `/:advanceUuid` popula o param. Guard de navegação: uuid mal formado NA
  // ROTA DE EDIÇÃO redireciona para o grid ANTES de renderizar — mirror
  // `CreateOrUpdateCicloProducao.tsx`.
  const hasMalformedRouteParam = advanceUuid !== undefined && !isValidGuid(advanceUuid);

  useEffect(() => {
    if (hasMalformedRouteParam) {
      navigate(ADVANCES_LIST_ROUTE, { replace: true });
    }
  }, [hasMalformedRouteParam, navigate]);

  const isEditing = isValidGuid(advanceUuid);
  const text = languageGB.advances.advance;
  const canSave = isEditing ? can('advances_edit') : can('advances_create');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<AdvanceFormType>({
    mode: 'onChange',
    resolver: advanceSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      employee_uuid: '',
      event_uuid: '',
      date: todayLocalIso(),
      amount: null,
      installments: [{ month: '', value: null }],
      // ---- D2-REV — "Gerar Financeiro" (bloco SEMPRE presente na forma do
      // RHF; só validado/enviado quando `has_financial=true`, §B.3). ----
      has_financial: false,
      financial: {
        type_uuid: '',
        provider_uuid: null,
        proprietary_uuid: null,
        number: null,
        note: null,
        fiscal_document: '1',
        has_input: false,
        input_date: null,
        input_value: null,
        installments: [],
        categories: [],
      },
    },
  });

  // ---- "Picked options" de exibição dos 2 selects relacionais — ver nota
  // de cabeçalho. Semeados por `fillForm`; atualizados no `onChange`. ------
  const [employeeOption, setEmployeeOption] = useState<Option | null>(null);
  const [eventOption, setEventOption] = useState<Option | null>(null);

  // ---- "Picked options" do bloco financeiro (D2-REV) — mesma convenção,
  // ver `FinancialBlock.tsx`/`FinancialApportionmentFieldArray.tsx`. O
  // header (type/provider/proprietary) É reidratado no EDIT (GAP-ADV-02,
  // via `hydrateFinancialFromResource`) — populado também quando o usuário
  // escolhe/troca no CREATE. ----
  const [financialTypeOption, setFinancialTypeOption] = useState<Option | null>(null);
  const [financialProviderOption, setFinancialProviderOption] = useState<Option | null>(null);
  const [financialProprietaryOption, setFinancialProprietaryOption] = useState<Option | null>(null);
  const [pickedCategoryOptions, setPickedCategoryOptions] = useState<Record<string, Option>>({});
  const [pickedCenterOptions, setPickedCenterOptions] = useState<Record<string, Option>>({});

  // Bloco financeiro em branco — mesmo default de `useForm` acima, reusado
  // quando `has_financial=false` (nenhum Expense gerado ainda/toggle
  // desligado) — base neutra, sem relação com nenhum gap (GAP-ADV-02
  // resolvido: o EDIT reidrata tudo via `hydrateFinancialFromResource`).
  const blankFinancial: AdvanceFormType['financial'] = {
    type_uuid: '',
    provider_uuid: null,
    proprietary_uuid: null,
    number: null,
    note: null,
    fiscal_document: '1',
    has_input: false,
    input_date: null,
    input_value: null,
    installments: [],
    categories: [],
  };

  function fillForm(data: Advance, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      // GAP-ADV-02 (confirmado no código real) — hidratação COMPLETA do
      // financeiro no EDIT: header + installments + categories vêm 1:1 de
      // `data.financial.*` via `hydrateFinancialFromResource`. Só
      // has_input/input_* ficam neutros (nunca persistidos).
      let financial = blankFinancial;
      if (data.has_financial && data.financial) {
        const hydrated = hydrateFinancialFromResource(data);
        financial = hydrated.financial;
        setFinancialTypeOption(hydrated.typeOption);
        setFinancialProviderOption(hydrated.providerOption);
        setFinancialProprietaryOption(hydrated.proprietaryOption);
        setPickedCategoryOptions(hydrated.categoryOptions);
        setPickedCenterOptions(hydrated.centerOptions);
      } else {
        setFinancialTypeOption(null);
        setFinancialProviderOption(null);
        setFinancialProprietaryOption(null);
        setPickedCategoryOptions({});
        setPickedCenterOptions({});
      }

      reset({
        uuid: data.uuid,
        employee_uuid: data.employee?.uuid ?? '',
        event_uuid: data.event?.uuid ?? '',
        date: data.date,
        amount: Number(data.amount),
        installments: (data.installments ?? []).map((row) => ({
          month: row.month,
          value: Number(row.value),
        })),
        has_financial: !!data.has_financial,
        financial,
      });

      setEmployeeOption(
        data.employee
          ? { label: data.employee.name ?? data.employee.uuid, value: data.employee.uuid }
          : null
      );
      setEventOption(data.event ? { label: data.event.name, value: data.event.uuid } : null);
    }
  }

  const advanceQuery = useAdvanceForm({
    registrationId: isEditing ? advanceUuid : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([advanceQuery as any]);

  const advanceMutation = useRequest({
    asyncFunction: tryPersistAdvance,
    entityName: text.singularLabel,
    queryKey: queryKey.advances.advances,
    queryKey2: queryKey.advances.advance,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // FE-FORM-MODE — SEMPRE os 5 campos núcleo completos (create E update),
  // nunca patch parcial por `dirtyFields` (decisão de arquitetura §4.3 da
  // FID-G3A, acoplamento amount↔installments). D2-REV: `has_financial` +
  // `financial` (quando ligado) também vão completos, mesma regra
  // full-replace (FID-G3F §9.1) — o servidor apaga+regenera os `Expense`.
  async function tryPersistAdvance(data: AdvanceFormType) {
    const payload: AdvancePayload = {
      employee_uuid: data.employee_uuid,
      event_uuid: data.event_uuid,
      date: data.date,
      amount: Number(data.amount),
      installments: data.installments.map((row) => ({
        month: row.month,
        value: Number(row.value),
      })),
      has_financial: !!data.has_financial,
    };

    // Payload financeiro montado SEM `percent` (UI-only) e SEM os inputs do
    // gerador (qtd/1ª data/intervalo — local state, nunca no RHF/payload).
    // `has_financial=false` OMITE `financial` inteiro (servidor descarta).
    if (data.has_financial) {
      payload.financial = {
        type_uuid: data.financial.type_uuid,
        provider_uuid: data.financial.provider_uuid || null,
        proprietary_uuid: data.financial.proprietary_uuid || null,
        number: data.financial.number || null,
        note: data.financial.note || null,
        fiscal_document: data.financial.fiscal_document,
        has_input: !!data.financial.has_input,
        input_date: data.financial.has_input ? data.financial.input_date : null,
        input_value: data.financial.has_input ? Number(data.financial.input_value) : null,
        installments: data.financial.installments.map((row) => ({
          due_date: row.due_date,
          value: Number(row.value),
        })),
        // `percent` descartado — só `category_uuid`/`value`/`center_uuid` no
        // wire (DEC-FIN-B: sem `plan_account`).
        categories: data.financial.categories.map((row) => ({
          category_uuid: row.category_uuid,
          value: Number(row.value),
          center_uuid: row.center_uuid,
        })),
      };
    }

    try {
      return isEditing && advanceUuid
        ? await updateAdvance(advanceUuid, payload)
        : await createAdvance(payload);
    } catch (error) {
      // 422 por campo mapeado LOCALMENTE (mirror `tryPersistProductionCycle`)
      // — em especial `installments` (invariante Σ==amount, FE-FORM-422) e,
      // agora, os paths ANINHADOS do financeiro (`financial.installments`,
      // `financial.categories`, `financial.type_uuid`, ...) — RHF aceita
      // `setError` com path aninhado direto (FE-FIN-422).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as any, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      // 403 FinancialFreeze / 422 baixa ocorrida (amount≠balance): a
      // `message` do servidor NÃO é engolida aqui — o `onError` do
      // `useRequest` (Regra 6 do padrão de mutação) já exibe
      // statusCode + message em toast, sem tratamento especial de código
      // (D1/C-19, FE-FIN-403-FREEZE/FE-FIN-403-BAIXA).
      throw error;
    }
  }

  async function onSubmit(data: AdvanceFormType) {
    // `isEmpty` tem semântica INVERTIDA no projeto (`src/utils/isEmpty.ts`):
    // retorna `true` quando o objeto TEM chaves. Editar sem nenhum campo
    // "sujo" não deve chamar a API — mesmo padrão canônico de
    // `CreateOrUpdateCicloProducao.tsx`/~40 siblings.
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await advanceMutation.mutateAsync(data);
    }
  }

  const isSubmitting = advanceMutation.isPending;

  if (hasMalformedRouteParam) {
    return null;
  }

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
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Painel "Dados Gerais" — mesmo idioma visual de
            `CicloProducaoDetalhe.tsx`/`CreateOrUpdateCicloProducao.tsx`
            (Passo UX/adaptação ao padrão vigente, UX-GAP §1). */}
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
            {text.detail.generalData.title}
          </Text>

          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="employee_uuid"
              control={control}
              render={({ field: { name, onChange }, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={name}
                  label={text.form.fields.employee}
                  service={listEmployees}
                  mapOptions={(item: EmployeeListItem) => ({ label: item.name, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={employeeOption ?? undefined}
                  onChange={(opt: any) => {
                    setEmployeeOption(opt ?? null);
                    onChange(opt?.value ?? '');
                  }}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave || !!isLoading}
                />
              )}
            />

            {/* Evento SEM filtro de tipo — default FID-G3F §6.2 (D1 do dono:
              fiel ao legado, que não restringia server-side). */}
            <Controller
              name="event_uuid"
              control={control}
              render={({ field: { name, onChange }, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={name}
                  label={text.form.fields.event}
                  service={listEvents}
                  mapOptions={(item: EventListItem) => ({ label: item.name, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={eventOption ?? undefined}
                  onChange={(opt: any) => {
                    setEventOption(opt ?? null);
                    onChange(opt?.value ?? '');
                  }}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave || !!isLoading}
                />
              )}
            />

            <Controller
              name="date"
              control={control}
              render={({ field, fieldState }) => (
                <DateInput
                  value={field.value ?? null}
                  onChange={(value) => field.onChange(value ?? '')}
                  label={text.form.fields.date}
                  error={fieldState.error?.message}
                  isRequired
                  disabled={!canSave || !!isLoading}
                />
              )}
            />

            <Controller
              name="amount"
              control={control}
              render={({ field, fieldState }) => (
                <MoneyInput
                  name={field.name}
                  label={text.form.fields.amount}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                  error={fieldState.error?.message}
                  isRequired
                  disabled={!canSave || !!isLoading}
                />
              )}
            />
          </SimpleGrid>
        </Box>

        {/* Painel "Rateio do Adiantamento" (D6 — rename; diferencial
            installments do núcleo) — mesmo idioma visual do painel acima. */}
        <Box
          mt={6}
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          p={4}
        >
          <InstallmentsFieldArray
            control={control}
            errors={errors}
            watch={watch}
            isLoading={!!isLoading}
            canSave={canSave}
          />
        </Box>

        {/* Painel "Gerar Financeiro" (D2-REV) — toggle + header + parcelas
            financeiras + rateio por categoria. Casca própria (bg.muted)
            dentro de `FinancialBlock`, mesmo idioma visual dos painéis
            acima. */}
        <FinancialBlock
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
          isLoading={!!isLoading}
          canSave={canSave}
          financialTypeOption={financialTypeOption}
          setFinancialTypeOption={setFinancialTypeOption}
          financialProviderOption={financialProviderOption}
          setFinancialProviderOption={setFinancialProviderOption}
          financialProprietaryOption={financialProprietaryOption}
          setFinancialProprietaryOption={setFinancialProprietaryOption}
          pickedCategoryOptions={pickedCategoryOptions}
          setPickedCategoryOptions={setPickedCategoryOptions}
          pickedCenterOptions={pickedCenterOptions}
          setPickedCenterOptions={setPickedCenterOptions}
        />
      </Form>
    </FormContainer>
  );
}
