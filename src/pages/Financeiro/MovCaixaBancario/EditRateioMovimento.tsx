// src/pages/Financeiro/MovCaixaBancario/EditRateioMovimento.tsx
// -----------------------------------------------------------------------------
// Tela DEDICADA de reedição do RATEIO de um Movimento Caixa/Bancário já
// existente (Movement — Financeiro, TASK-MV-FE-06). Rota:
// `/financeiro/caixa/:uuid/rateio` (guardada por `movements_create`,
// Decisão #7 — mesmo slug reusado pelo form completo, sem permissão
// dedicada de update).
//
// Mirror do legado `edit-rateio`/`_forms-update.blade.php`
// (Movement-contrato.md §3, Movement-contrato-tela.md §4 "Reuso"): carrega o
// movimento por `uuid` (MESMO endpoint `show` de TASK-MV-FE-02, `getMovement`
// — nenhum endpoint novo), exibe o cabeçalho (código/data/conta/valor)
// 100% READ-ONLY e reusa o `MovementAllocationEditor` (TASK-MV-FE-03) para
// editar SÓ `allocations[]`.
//
// Regra inviolável (ficha "Riscos + solução"): o `value` do cabeçalho é
// usado SÓ como referência de cálculo cosmético (percentual/total do
// `MovementAllocationEditor`) — NUNCA um campo de formulário, NUNCA parte do
// `useForm`, NUNCA enviado no payload. `PATCH /movements/{uuid}/allocation`
// (`updateMovementAllocation`, TASK-MV-FE-02) só aceita `{ allocations: [] }`
// e recalcula sobre o `value` ATUAL do movimento — este submit NUNCA recria
// o cabeçalho (Movement-contrato-tela.md §2.2/§2.6, diferente de
// `CreateOrUpdateMovimento.tsx`/TASK-MV-FE-05, cujo `PUT` apaga-e-recria e
// troca o `uuid`). Como o `uuid` NÃO muda aqui, é seguro invalidar a query de
// detalhe pelo MESMO `uuid` após o sucesso.
//
// DESVIO DELIBERADO idêntico ao já registrado em `CreateOrUpdateMovimento.tsx`
// (TASK-MV-FE-05) — a ficha cita `useCustomFormQueryById`, mas esse hook
// (apesar do nome) é a variante LEGADA de ID NUMÉRICO; `useCustomFormQueryByGuid`
// é o precedente REAL e dominante (~40 módulos, ex. `CentroCusto`/
// `ContasBancarias`/o próprio `CreateOrUpdateMovimento.tsx`) para forms
// create/edit por GUID neste projeto. Fonte de verdade real > texto genérico
// da ficha — mesmo racional, não uma nova decisão desta Tarefa.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid, Skeleton } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { FormContainer } from '@/components/Layout/FormContainer';
import { MovementAllocationEditor } from '@/components/MovementAllocationEditor/MovementAllocationEditor';
import type { AllocationsFieldValues } from '@/components/MovementAllocationEditor/MovementAllocationEditor';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';
import { allocationsSumMatchesHeader } from '@/utils/movementAllocationSum';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { movementAllocationSchemaResolver } from '@/validations/schemas/Movement/movement-allocation-schema';

import { getMovement, updateMovementAllocation } from '@/services/v2/Movements/movement-service';

import type {
  MovementAllocationForm as MovementAllocationFormType,
  MovementAllocationPayload,
  MovementAllocationRequestPayload,
  MovementDetail,
} from '@/@types/v2/Movements';

import type { UseFieldArrayAppend } from 'react-hook-form';

// Mesmo formatador local usado em `index.tsx`/`MovementAllocationEditor.tsx`
// deste módulo (sem utilitário compartilhado no projeto para isso).
function formatCurrencyBRL(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 422 mapeado por campo — SÓ linhas de `allocations[]` (get_spa_api_client_pattern
// §3): o payload desta tela não tem nenhum campo de cabeçalho, então não há
// `knownRootFields` a mapear (diferente de `CreateOrUpdateMovimento.tsx`).
function applyServerFieldErrors(
  error: unknown,
  setError: (name: any, error: { type: string; message: string }) => void
) {
  if (!isAxiosError(error) || error.response?.status !== 422) return;
  const backendErrors = (error.response.data as any)?.errors as
    Record<string, string[]> | undefined;
  if (!backendErrors) return;

  const itemFieldPattern =
    /^allocations\.(\d+)\.(category_uuid|center_uuid|plan_account_uuid|harvest_uuid|value)$/;

  Object.entries(backendErrors).forEach(([field, messages]) => {
    const message = messages[0];
    if (!message) return;

    const itemMatch = field.match(itemFieldPattern);
    if (itemMatch) {
      setError(`allocations.${itemMatch[1]}.${itemMatch[2]}`, { type: 'server', message });
    }
    // Erro de nível de ARRAY (`allocations` — ex.: `min:1`) e qualquer erro
    // de negócio sem campo específico caem no fallback genérico do toast
    // (já exibido pelo `onError` implícito do `useRequest`).
  });
}

export default function EditRateioMovimento() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.movements.movement;
  // §2.5 do contrato de tela — `PATCH .../allocation` reusa o slug
  // `movements_create` (Decisão #7), mesma permissão do form completo.
  const canSave = can('movements_create');

  // Guard de navegação — `uuid` ausente/malformado nunca chega ao hook de
  // query (get_pwa_form_query_pattern, "Guard de navegação"); esta tela NUNCA
  // tem modo "criar", então um `uuid` inválido só pode significar navegação
  // direta indevida — volta para a listagem.
  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate('/financeiro/caixa');
    }
  }, [uuid, navigate]);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<MovementAllocationFormType>({
    mode: 'onChange',
    resolver: movementAllocationSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: { allocations: [] },
  });

  const {
    fields: allocationFields,
    append: appendAllocation,
    remove: removeAllocation,
  } = useFieldArray({ control, name: 'allocations' });

  // Lei 2 (get_pwa_form_query_pattern) — função NOMEADA com guarda de
  // `dirtyFields`. Popula SÓ `allocations[]` — o cabeçalho é lido direto de
  // `movementQuery.data` e exibido read-only, NUNCA entra neste `useForm`
  // (ficha "Riscos + solução").
  function fillAllocationForm(data: MovementDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) && !resetForce) return;

    reset({
      allocations: (data.allocations ?? []).map((row) => ({
        category_uuid: {
          label: `${row.category.code} — ${row.category.description}`,
          value: row.category.uuid,
        },
        center_uuid: row.center
          ? { label: `${row.center.code} — ${row.center.description}`, value: row.center.uuid }
          : null,
        plan_account_uuid: row.plan_account
          ? {
              label: `${row.plan_account.code} — ${row.plan_account.description}`,
              value: row.plan_account.uuid,
            }
          : null,
        harvest_uuid: row.harvest
          ? { label: row.harvest.description, value: row.harvest.uuid }
          : null,
        value: Number(row.value),
      })),
    });
  }

  const movementQuery = useCustomFormQueryByGuid<MovementDetail>({
    registrationId: isValidGuid(uuid) ? uuid : undefined,
    asyncFunction: getMovement,
    queryKey: queryKey.financial.movement,
    fillForm: fillAllocationForm,
  });

  const isLoading = checkLoadingStatus([movementQuery as any]);
  const movementData = (movementQuery as any)?.data as MovementDetail | undefined;
  // Cabeçalho é referência de cálculo COSMÉTICO só — nunca editável, nunca
  // enviado no payload (Movement-contrato-tela.md §2.2/§4; ficha "Riscos +
  // solução"). Passado ao `MovementAllocationEditor` exatamente como o
  // `value` ATUAL do movimento, sem round-trip nem edição local.
  const headerValue = Number(movementData?.value) || 0;

  const allocationMutation = useRequest({
    asyncFunction: tryPersistAllocation,
    entityName: text.singularLabel,
    personalizedMessage: text.allocation.toastSuccess,
    queryKey: queryKey.financial.movements,
    queryKey2: queryKey.financial.movement,
    typesRequest: 'update',
    actionSuccess: () => {
      // `uuid` NÃO muda aqui (`PATCH .../allocation` não recria o cabeçalho,
      // Movement-contrato.md §2.2/§3) — diferente de TASK-MV-FE-05 (Decisão
      // #6, apagar-e-recriar). O padrão de navegação pós-sucesso é o mesmo
      // (`navigate(-1)`), mas aqui é seguro porque a query de detalhe
      // (`queryKey2`) já foi invalidada pelo MESMO `uuid`.
      navigate(-1);
    },
  });

  // Regra 10 (inviolável) — recalcula SEMPRE sobre o `value` ATUAL do
  // movimento; este submit NUNCA recria o cabeçalho. Só `allocations[]` vai
  // no payload — nenhum campo de cabeçalho, mesmo que `movementData` esteja
  // disponível neste escopo.
  async function tryPersistAllocation(data: MovementAllocationFormType) {
    const allocations: MovementAllocationPayload[] = data.allocations.map((item) => ({
      category_uuid: item.category_uuid!.value,
      center_uuid: item.center_uuid!.value,
      plan_account_uuid: item.plan_account_uuid?.value ?? null,
      harvest_uuid: item.harvest_uuid?.value ?? null,
      value: Number(item.value),
    }));

    const payload: MovementAllocationRequestPayload = { allocations };
    return await updateMovementAllocation(uuid!, payload);
  }

  // TASK-MV-FE-08 (Ajuste 2) — este form (`MovementAllocationForm`) não tem
  // `value` de cabeçalho no próprio `useForm` (ver cabeçalho do arquivo) —
  // um `.test()` do Yup não alcança `headerValue` (variável externa). Guarda
  // MANUAL, ANTES de `mutateAsync`, mirror do bloqueio do form completo
  // (`movement-schema.ts`, mesma tolerância de 1 centavo).
  async function onSubmit(data: MovementAllocationFormType) {
    if (!allocationsSumMatchesHeader(data.allocations, headerValue)) {
      setError('allocations', {
        type: 'sum-mismatch',
        message: text.form.validation.allocationsSumMismatch,
      });
      return;
    }
    try {
      await allocationMutation.mutateAsync(data);
    } catch (error) {
      applyServerFieldErrors(error, setError as any);
    }
  }

  const isSubmitting = allocationMutation.isPending;

  return (
    <FormContainer
      title={text.allocation.title}
      subtitle={text.allocation.subtitle}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={false}
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
        {/* Cabeçalho READ-ONLY — código/data/conta/valor. NUNCA um <input>
            editável, NUNCA parte do `useForm`/payload (ficha "Riscos +
            solução", DoD). */}
        <Box
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          px={4}
          py={3}
          mb={6}
        >
          <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
            <Skeleton loading={isLoading} borderRadius="md">
              <InputReadOnly
                name="code"
                label={text.list.table.code}
                value={movementData?.code ?? ''}
              />
            </Skeleton>
            <Skeleton loading={isLoading} borderRadius="md">
              <InputReadOnly
                name="date"
                label={text.list.table.date}
                value={
                  movementData?.date ? new Date(movementData.date).toLocaleDateString('pt-BR') : ''
                }
              />
            </Skeleton>
            <Skeleton loading={isLoading} borderRadius="md">
              <InputReadOnly
                name="account"
                label={text.list.table.account}
                value={
                  movementData?.account
                    ? `${movementData.account.bank} — ${movementData.account.agency}/${movementData.account.account}`
                    : ''
                }
              />
            </Skeleton>
            <Skeleton loading={isLoading} borderRadius="md">
              <InputReadOnly
                name="value"
                label={text.list.table.value}
                value={movementData ? formatCurrencyBRL(headerValue) : ''}
              />
            </Skeleton>
          </SimpleGrid>
        </Box>

        {/* Rateio — componente reutilizável TASK-MV-FE-03, `useFieldArray`
            vive AQUI no pai (mesma decisão estrutural de
            `CreateOrUpdateMovimento.tsx`). */}
        <MovementAllocationEditor
          control={control}
          fields={allocationFields}
          // Cast pragmático — mesmo racional documentado em
          // `MovementAllocationEditor.tsx`/`CreateOrUpdateMovimento.tsx`.
          append={
            appendAllocation as unknown as UseFieldArrayAppend<
              AllocationsFieldValues,
              'allocations'
            >
          }
          remove={removeAllocation}
          headerValue={headerValue}
          errors={errors}
          languageGB={languageGB}
          disabled={!canSave}
        />
      </Form>
    </FormContainer>
  );
}
