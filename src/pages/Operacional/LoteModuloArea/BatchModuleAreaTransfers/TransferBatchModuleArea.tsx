// src/pages/Operacional/LoteModuloArea/BatchModuleAreaTransfers/TransferBatchModuleArea.tsx
// -----------------------------------------------------------------------------
// Tela de TRANSFERÊNCIA "Lote/Módulo/Área" (BatchModuleAreaTransfer —
// Operacional > Pecuária > Transferências, 97-Esteiras/070, TASK-LMA-FE-03 +
// TASK-LMA-FE-04). Rota `/operacional/lote-modulo-area/transferencias/:batchUuid`,
// guardada por `<RequirePermission permission="batch_module_area_transfers_create">`
// (mirror do gate de `canCreate` já usado pela Listagem, FE-02).
//
// ⚠️ NÃO é edição de uma entidade existente — é a criação de um NOVO registro
// de transferência para um Lote já escolhido na Listagem (`:batchUuid` é
// CONTEXTO, não o id de algo a editar). Por isso `useQuery` DIRETO
// (`get_pwa_specialized_logic_pattern §6.10`) + `reset()` único no
// `isSuccess`, e NÃO `useCustomFormQueryById` — decisão já tomada e não
// reaberta (`F-023-lote-modulo-area-frontend-contract.md ## 5.2`).
//
// ACHADO CRÍTICO herdado do schema de FE-01
// (`validations/schemas/LoteModuloArea/batchModuleAreaTransfer-schema.ts`):
// os 3 campos de destino são `yup.string().nullable()` — o form armazena o
// UUID CRU (string), não o `Option<{label,value}>` que o `<Select>` do
// catálogo devolve por padrão (`get_pwa_ui_components_pattern §5.4`). Se o
// form guardasse o objeto `Option`, o `yupResolver` (yup.string() faz cast
// via `.toString()`) corromperia o valor para a string literal
// "[object Object]". Resolvido adaptando NA FRONTEIRA do `<Select>`:
// `value={options.find((o) => o.value === field.value) ?? null}` /
// `onChange={(opt) => field.onChange(opt?.value ?? null)}` — o form nunca
// guarda o objeto, só o uuid.
//
// 10 campos do form legado (`_forms.blade.php`), ORDEM EXATA — os 3 hidden
// (`tenant_id`/`farm_id`/`batch_id`) e o órfão `employee_uuid` NÃO são
// renderizados (contrato de tela `## 4.2`/`## Leitura do dev`):
//   4  code                — InputReadOnly (create-options.code)
//   5  date                — DateInput (Controller), required, check-date (FE-04)
//   6  responsável         — InputReadOnly (useAuth().user?.username, sessão)
//   7  batch               — InputReadOnly (create-options.batch)
//   8  qtd                 — InputReadOnly (create-options.qtd)
//   9  area (vínculo atual)— InputReadOnly (create-options.area ?? '—')
//   10 area_uuid/grazing_uuid/feedlot_corral_uuid — Select XOR (create-options.*, estático)
//
// Payload de submit — EXATO (contrato de tela `## Payload de submit`):
// `{ batch_uuid, date, area_uuid?, grazing_uuid?, feedlot_corral_uuid? }`.
// NUNCA `code`/`batch`/`qtd`/`area`/`employee_uuid`/`tenant_id`/`farm_id`/`user_id`.
//
// Cascata (TASK-LMA-FE-04, mirror IG-1..4 do legado): selecionar um dos 3
// destinos limpa os outros dois + dispara `check-date`; trocar a data
// revalida o destino já selecionado (se houver). Os 3 swal distintos do
// Blade viram `toaster.error()` (`get_spa_ux_fidelity_pattern` — sem
// `window.alert`/`swal` na SPA).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef } from 'react';

import { SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { batchModuleAreaTransferSchemaResolver } from '@/validations/schemas/LoteModuloArea/batchModuleAreaTransfer-schema';

import {
  checkBatchModuleAreaTransferDate,
  createBatchModuleAreaTransfer,
  getBatchModuleAreaTransferOptions,
} from '@/services/v2/LoteModuloArea/batchModuleAreaTransfer-service';

import type { Option } from '@/@types/option';
import type { BatchDetail } from '@/@types/v2/LoteFazenda/transferBatchFarm';
import type {
  BatchModuleAreaTransferDestinationOption,
  BatchModuleAreaTransferOptions,
  CreateBatchModuleAreaTransferRequest,
} from '@/@types/v2/LoteModuloArea/batchModuleAreaTransfer';

const TRANSFERS_LIST_ROUTE = '/operacional/lote-modulo-area/transferencias';
const TRANSFER_FORM_ID = 'batch-module-area-transfer-form';

// Form state — destino GUARDA STRING (uuid cru), não `Option` (ver nota de
// cabeçalho, achado do schema de FE-01).
interface BatchModuleAreaTransferFormValues {
  date: string | null;
  area_uuid: string | null;
  grazing_uuid: string | null;
  feedlot_corral_uuid: string | null;
}

const emptyFormValues: BatchModuleAreaTransferFormValues = {
  date: null,
  area_uuid: null,
  grazing_uuid: null,
  feedlot_corral_uuid: null,
};

type DestinationKind = 'area' | 'grazing' | 'corral';

// `description` (areas/grazings) ou `name` (feedlot_corrals) — mirror do
// contrato de API `## 4.2`.
function mapDestinationOptions(
  items: BatchModuleAreaTransferDestinationOption[] | undefined
): Option<string>[] {
  return (items ?? []).map((item) => ({
    label: item.description ?? item.name ?? '',
    value: item.uuid,
  }));
}

export default function TransferBatchModuleArea() {
  const { batchUuid } = useParams<{ batchUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { user } = useAuth();
  const text = languageGB.loteModuloArea.batchModuleAreaTransfer;

  // Guard de navegação — UUID malformado não deve chegar à query (mirror
  // `get_pwa_form_query_pattern §Guard de navegação`).
  useEffect(() => {
    if (!batchUuid || !isValidGuid(batchUuid)) {
      navigate(TRANSFERS_LIST_ROUTE, { replace: true });
    }
  }, [batchUuid, navigate]);

  const { control, handleSubmit, reset, setValue } = useForm<BatchModuleAreaTransferFormValues>({
    mode: 'onChange',
    resolver: batchModuleAreaTransferSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: emptyFormValues,
  });

  // Composição com `useQuery` DIRETO — NÃO é `useCustomFormQueryById` (não há
  // entidade por UUID próprio a editar, `create-options` é CONTEXTO para um
  // sempre-INSERT). Mirror `get_pwa_specialized_logic_pattern §6.10`.
  const optionsQuery = useQuery({
    queryKey: [queryKey.batchModuleAreaTransfer.createOptions, batchUuid],
    queryFn: async () => {
      const response = await getBatchModuleAreaTransferOptions(batchUuid!);
      return response.data;
    },
    enabled: !!batchUuid && isValidGuid(batchUuid),
  });

  const optionsData: BatchModuleAreaTransferOptions | undefined = optionsQuery.data;

  // Só os campos ÚNICOS que vêm preenchidos na resposta (`date`) precisam de
  // `reset()` — code/batch/qtd/area/user são exibidos via `optionsData`
  // diretamente (`InputReadOnly`), nunca viram campo controlado do form
  // (contrato de tela `## 4.2`). Populamento ÚNICO no `isSuccess`: os únicos
  // campos editáveis (`date`, 3 destinos) NÃO vêm preenchidos (CLM-032, abre
  // sempre em branco) — sem risco de apagar edição do usuário/`dirtyFields`.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (optionsQuery.isSuccess && optionsData) {
      reset({ ...emptyFormValues, date: optionsData.date });
      initializedRef.current = true;
    }
  }, [optionsQuery.isSuccess]);

  const areaOptions = useMemo(() => mapDestinationOptions(optionsData?.areas), [optionsData]);
  const grazingOptions = useMemo(() => mapDestinationOptions(optionsData?.grazings), [optionsData]);
  const corralOptions = useMemo(
    () => mapDestinationOptions(optionsData?.feedlot_corrals),
    [optionsData]
  );

  const createMutation = useRequest<BatchDetail>({
    asyncFunction: (payload: CreateBatchModuleAreaTransferRequest) =>
      createBatchModuleAreaTransfer(payload),
    entityName: text.singularLabel,
    queryKey: queryKey.batchModuleAreaTransfer.transfers, // invalida a Listagem (mirror S-SIDEEFFECT-CREATE-LOG)
    typesRequest: 'create',
    actionSuccess: () => navigate(TRANSFERS_LIST_ROUTE),
  });

  // Payload — EXATO, nunca `code`/`batch`/`qtd`/`area`/`employee_uuid`.
  function onSubmit(data: BatchModuleAreaTransferFormValues) {
    if (!batchUuid) return;
    createMutation.mutate({
      batch_uuid: batchUuid,
      date: data.date as string,
      area_uuid: data.area_uuid ?? undefined,
      grazing_uuid: data.grazing_uuid ?? undefined,
      feedlot_corral_uuid: data.feedlot_corral_uuid ?? undefined,
    });
  }

  const isSubmitting = createMutation.isPending;
  const isLoading = checkLoadingStatus([optionsQuery as any]);
  const isError = optionsQuery.isError;

  // ---- TASK-LMA-FE-04 — Cascata de destino (XOR) + validação cruzada de
  // data (mirror IG-1..4 do legado). ----
  const [watchArea, watchGrazing, watchCorral, watchDate] = useWatch({
    control,
    name: ['area_uuid', 'grazing_uuid', 'feedlot_corral_uuid', 'date'],
  });

  const prevDestination = useRef<{
    area: string | null;
    grazing: string | null;
    corral: string | null;
  }>({ area: null, grazing: null, corral: null });

  // Reseta a memória de "valor anterior" quando o form é (re)populado —
  // evita que a cascata dispare no primeiro render pós-`reset()`.
  useEffect(() => {
    if (optionsQuery.isSuccess) {
      prevDestination.current = { area: null, grazing: null, corral: null };
    }
  }, [optionsQuery.isSuccess]);

  async function runCheckDate(
    extra: { area_uuid?: string; grazing_uuid?: string; feedlot_corral_uuid?: string },
    kind: DestinationKind
  ) {
    if (!watchDate || !batchUuid) return;
    try {
      const { data } = await checkBatchModuleAreaTransferDate({
        date: watchDate,
        batch_uuid: batchUuid,
        ...extra,
      });
      if (!data.valid) throw new Error('invalid-date');
    } catch {
      const message =
        kind === 'area'
          ? text.cascade.dateInvalidForArea
          : kind === 'grazing'
            ? text.cascade.dateInvalidForGrazing
            : text.cascade.dateInvalidForCorral;
      toaster.error({ title: text.form.title, description: message, duration: 7000 });
      const fieldName =
        kind === 'area' ? 'area_uuid' : kind === 'grazing' ? 'grazing_uuid' : 'feedlot_corral_uuid';
      setValue(fieldName, null, { shouldValidate: true });
    }
  }

  // Limpeza mútua — selecionar um destino limpa os outros dois + dispara
  // `check-date` (mirror IG-1/IG-2/IG-3). `if/else if`: só 1 ramo por
  // execução, evita loop entre os `setValue` de limpeza.
  useEffect(() => {
    if (!initializedRef.current) return;

    const areaChanged = watchArea !== prevDestination.current.area;
    const grazingChanged = watchGrazing !== prevDestination.current.grazing;
    const corralChanged = watchCorral !== prevDestination.current.corral;

    if (areaChanged && watchArea) {
      setValue('grazing_uuid', null, { shouldValidate: true });
      setValue('feedlot_corral_uuid', null, { shouldValidate: true });
      void runCheckDate({ area_uuid: watchArea }, 'area');
    } else if (grazingChanged && watchGrazing) {
      setValue('area_uuid', null, { shouldValidate: true });
      setValue('feedlot_corral_uuid', null, { shouldValidate: true });
      void runCheckDate({ grazing_uuid: watchGrazing }, 'grazing');
    } else if (corralChanged && watchCorral) {
      setValue('area_uuid', null, { shouldValidate: true });
      setValue('grazing_uuid', null, { shouldValidate: true });
      void runCheckDate({ feedlot_corral_uuid: watchCorral }, 'corral');
    }

    prevDestination.current = { area: watchArea, grazing: watchGrazing, corral: watchCorral };
    // Deps intencionalmente restritas a [watchArea, watchGrazing, watchCorral] —
    // `runCheckDate`/`setValue` são estáveis o suficiente para este efeito
    // (mirror `get_pwa_specialized_logic_pattern §6.4`); incluir `watchDate`
    // aqui re-disparia a cascata de limpeza a cada troca de data.
  }, [watchArea, watchGrazing, watchCorral]);

  // Validação cruzada de data (mirror IG-4) — troca de data dispara
  // `check-date{date,batch_uuid}` e, em sucesso, revalida o destino já
  // selecionado (2ª chamada aninhada do legado); falha reseta a data para o
  // valor original e exibe toast genérico.
  useEffect(() => {
    if (!initializedRef.current || !watchDate || !batchUuid) return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await checkBatchModuleAreaTransferDate({
          date: watchDate,
          batch_uuid: batchUuid,
        });
        if (cancelled) return;
        if (!data.valid) throw new Error('invalid-date');

        if (watchArea) await runCheckDate({ area_uuid: watchArea }, 'area');
        else if (watchGrazing) await runCheckDate({ grazing_uuid: watchGrazing }, 'grazing');
        else if (watchCorral) await runCheckDate({ feedlot_corral_uuid: watchCorral }, 'corral');
      } catch {
        if (cancelled) return;
        toaster.error({
          title: text.form.title,
          description: text.cascade.dateInvalidGeneric,
          duration: 7000,
        });
        setValue('date', optionsData?.date ?? null);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Deps intencionalmente restritas a [watchDate] — mirror IG-4, o gatilho
    // é EXCLUSIVAMENTE a troca de data; `watchArea`/`watchGrazing`/`watchCorral`
    // são lidos dentro do efeito (valor corrente da closure), não re-disparam.
  }, [watchDate]);

  if (batchUuid && !isValidGuid(batchUuid)) {
    return null;
  }

  return (
    <FormContainer
      title={text.form.title}
      footer={
        <>
          <Button
            title={text.form.cancelButton}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          />
          <Button
            title={text.form.saveButton}
            type="submit"
            form={TRANSFER_FORM_ID}
            loading={isSubmitting}
            disabled={isSubmitting || isLoading || isError}
          />
        </>
      }
    >
      {isError ? (
        <VStack gap={3} py={12}>
          <Text color="fg.muted">{text.form.error.message}</Text>
          <Button
            title={languageGB.defaltStrings.tryAgain}
            variant="outline"
            onClick={() => optionsQuery.refetch()}
          />
        </VStack>
      ) : (
        <Form id={TRANSFER_FORM_ID} noPadding onSubmit={handleSubmit(onSubmit)}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <InputReadOnly
              label={text.form.fields.code}
              value={optionsData?.code ?? ''}
              loading={isLoading}
            />

            <Controller
              name="date"
              control={control}
              render={({ field, fieldState }) => (
                <Field
                  label={text.form.fields.date}
                  isRequired
                  errorText={fieldState.error?.message}
                >
                  <DateInput
                    value={field.value ?? null}
                    onChange={field.onChange}
                    disabled={isSubmitting || isLoading}
                  />
                </Field>
              )}
            />

            <InputReadOnly
              label={text.form.fields.user}
              value={user?.username ?? ''}
              loading={isLoading}
            />

            <InputReadOnly
              label={text.form.fields.batch}
              value={optionsData?.batch ?? ''}
              loading={isLoading}
            />

            <InputReadOnly
              label={text.form.fields.qtd}
              value={String(optionsData?.qtd ?? 0)}
              loading={isLoading}
            />

            <InputReadOnly
              label={text.form.fields.area}
              value={optionsData?.area ?? '—'}
              loading={isLoading}
            />

            <Controller
              name="area_uuid"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  name={field.name}
                  label={text.form.fields.areaDestination}
                  options={areaOptions}
                  value={areaOptions.find((option) => option.value === field.value) ?? null}
                  onChange={(option: Option<string> | null) =>
                    field.onChange(option?.value ?? null)
                  }
                  error={fieldState.error?.message}
                  isDisabled={isSubmitting || isLoading}
                  loading={isLoading}
                />
              )}
            />

            <Controller
              name="grazing_uuid"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  name={field.name}
                  label={text.form.fields.grazingDestination}
                  options={grazingOptions}
                  value={grazingOptions.find((option) => option.value === field.value) ?? null}
                  onChange={(option: Option<string> | null) =>
                    field.onChange(option?.value ?? null)
                  }
                  error={fieldState.error?.message}
                  isDisabled={isSubmitting || isLoading}
                  loading={isLoading}
                />
              )}
            />

            <Controller
              name="feedlot_corral_uuid"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  name={field.name}
                  label={text.form.fields.corralDestination}
                  options={corralOptions}
                  value={corralOptions.find((option) => option.value === field.value) ?? null}
                  onChange={(option: Option<string> | null) =>
                    field.onChange(option?.value ?? null)
                  }
                  error={fieldState.error?.message}
                  isDisabled={isSubmitting || isLoading}
                  loading={isLoading}
                />
              )}
            />
          </SimpleGrid>
        </Form>
      )}
    </FormContainer>
  );
}
