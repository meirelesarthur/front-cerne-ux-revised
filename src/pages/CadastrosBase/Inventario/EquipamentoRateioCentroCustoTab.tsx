// src/pages/CadastrosBase/Inventario/EquipamentoRateioCentroCustoTab.tsx
// -----------------------------------------------------------------------------
// Aba "Rateio — Centro de Custo" do formulário de Inventário (Equipment) —
// TASK-FE-1008 (execução 026). Preenche o stub deixado pela âncora
// `TASK-FE-1005` dentro da casca de abas de `CreateOrUpdateEquipamento.tsx`.
//
// Mirror ESTRUTURAL do `ApportionmentsSection` de
// `CadastrosBase/CentroCusto/CreateOrUpdateCentroCusto.tsx` (useFieldArray +
// SelectAsyncPaginate + NumberInput percentual por linha + botão remover +
// Badge de soma) — MAS com uma divergência DELIBERADA de fidelidade
// (Equipment-Frontend-Contrato.md §7 + Doc Bruta RN-8): o precedente de
// `CostCenter` só valida a soma visualmente (badge informativo, não bloqueia
// submit); aqui o legado BLOQUEIA o submit (`swal`, tolerância 0,01) quando
// há ao menos 1 `cost_center_uuid` preenchido e a soma ≠ 100%.
//
// -- Onde vive o ENFORCEMENT real (não só o badge) --------------------------
// `equipment-schema.ts` (TASK-FE-1003) já expõe `cost_centers` com um
// `.test('cost-center-sum-100', ...)` de NÍVEL DE ARRAY, e esse schema é o
// `resolver` do `useForm` RAIZ inteiro em `CreateOrUpdateEquipamento.tsx`
// (as 5 abas compartilham UM ÚNICO resolver, mesmo achado já registrado em
// `product-schema.ts`). Isso já é suficiente para BLOQUEAR o submit de
// verdade: `handleSubmit(onSubmit, onInvalid)` do pai só invoca `onSubmit`
// (que dispara o `mutate`) quando o resolver passa — se a soma ≠ 100%, o
// resolver reprova e o pai cai no `onInvalid` (troca de aba + toast com a
// mensagem real do Yup, já 100% localizada). Ou seja: o "guard duplo"
// pedido pela Tarefa ("replicar no onSubmit antes do mutate") já existe
// estruturalmente pela combinação resolver+onInvalid do arquivo âncora —
// CHOKEPOINT desta execução (`CreateOrUpdateEquipamento.tsx` é da 1005/1011,
// não desta Tarefa), então NÃO duplicamos um segundo guard imperativo aqui.
// Esta aba consome o erro do array (`errors.cost_centers?.message`) para dar
// feedback VISUAL adicional (texto vermelho + Badge laranja) — dupla camada
// de COMUNICAÇÃO da mesma regra, não dois lugares de ENFORCEMENT.
//
// -- Select de Centro de Custo ------------------------------------------------
// Reaproveita `listCostCenterOptions` de `services/v2/CostCenters/
// cost-center-service.ts` (GET /cost-centers/options, JÁ EXISTE, PAGINADO)
// DIRETO como `service` do `SelectAsyncPaginate` — sem wrapper de exclusão
// (diferente do `listCostCentersForApportionment` de CostCenter, que exclui
// o PRÓPRIO registro da lista porque lá o rateio é centro-de-custo→
// centro-de-custo; aqui é equipamento→centro-de-custo, sem risco de
// autorreferência).
//
// `only_analytic: true` — execução 026, AJUSTE 3(a) do E2E do dev: o rateio
// é equipamento→centro-de-custo ANALÍTICO (folha); Centro de Custo SINTÉTICO
// (agrupador, `CostCenter.class = ANALYTICAL` é o enum que decide isso no
// backend, NÃO profundidade de árvore) não é destino válido de rateio.
// `only_analytic` já é aceito por `/cost-centers/options`
// (`CostCenterOptionsRequest.php:37`) — mesmo `findParams` de
// `StepFuncionario.tsx` (`{ search, only_analytic: true }`).
//
// -- i18n ---------------------------------------------------------------------
// 100% das chaves já existiam na entrega da TASK-FE-1002 (`module-equipments`
// + `languageEquipments.ts` ×3) — `form.fields.costCenter/percentage`,
// `form.placeholders.costCenter`, `form.sections.costCenterApportionmentSum`,
// `form.costCenterRow.addButton/removeButton/emptyLabel`,
// `form.validation.costCenterPercentageRequired/costCenterPercentageSum100`.
// NENHUMA chave nova precisou ser adicionada nesta Tarefa.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';

import type { Option } from '@/@types/option';
import type { EquipmentData, EquipmentForm } from '@/@types/v2/Equipments';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

/** Tolerância de soma do rateio (RN-8) — mirror EXATO da constante de
 *  `equipment-schema.ts` (`COST_CENTER_SUM_TOLERANCE`). Duplicada aqui de
 *  propósito (arquivo de schema é fronteira da TASK-FE-1003, não editável
 *  por esta Tarefa) só para o CÁLCULO de exibição do Badge — o ENFORCEMENT
 *  real continua 100% no `.test()` do schema, nunca recalculado aqui como
 *  gate de submit. */
const COST_CENTER_SUM_TOLERANCE = 0.01;
const COST_CENTER_SUM_TARGET = 100;

export interface EquipamentoRateioCentroCustoTabProps {
  control: Control<EquipmentForm>;
  errors: FieldErrors<EquipmentForm>;
  watch: UseFormWatch<EquipmentForm>;
  setValue: UseFormSetValue<EquipmentForm>;
  isLoading: boolean;
  canSave: boolean;
  isEditing: boolean;
  equipmentData?: EquipmentData;
}

export function EquipamentoRateioCentroCustoTab({
  control,
  errors,
  watch,
  isLoading,
  canSave,
  equipmentData,
}: EquipamentoRateioCentroCustoTabProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.equipments.equipment.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'cost_centers' });

  const isDisabled = !canSave || isLoading;

  // Cache de RÓTULOS `{label, value}` do SelectAsyncPaginate de cada linha —
  // mesma mecânica de `apportionmentOptionsCache` de CostCenter: mescla (1)
  // linhas que já vieram do servidor (`equipmentData.cost_centers`, edição,
  // já traz `code`/`description`) com (2) linhas escolhidas nesta sessão
  // (o próprio `SelectAsyncPaginate` devolve `{label, value}` no onChange).
  const serverCostCenterOptions = useMemo(() => {
    const map: Record<string, Option<string>> = {};
    equipmentData?.cost_centers?.forEach((row) => {
      map[row.uuid] = { label: `${row.code} — ${row.description}`, value: row.uuid };
    });
    return map;
  }, [equipmentData]);

  const [pickedCostCenterOptions, setPickedCostCenterOptions] = useState<
    Record<string, Option<string>>
  >({});

  const costCenterOptionsCache: Record<string, Option<string>> = {
    ...serverCostCenterOptions,
    ...pickedCostCenterOptions,
  };

  function handlePickCostCenterOption(option: Option<string>) {
    setPickedCostCenterOptions((prev) => ({ ...prev, [option.value]: option }));
  }

  // Badge de soma — leitura de `watch('cost_centers')`, mesmo cálculo do
  // `.test()` de `equipment-schema.ts` (mesma tolerância), só para EXIBIÇÃO.
  const watchedCostCenters = watch('cost_centers') ?? [];
  const totalPercentage = watchedCostCenters.reduce(
    (sum, row) => sum + (Number(row?.percentage) || 0),
    0
  );
  const isSumComplete =
    Math.abs(totalPercentage - COST_CENTER_SUM_TARGET) <= COST_CENTER_SUM_TOLERANCE;

  // Erro de nível de ARRAY (`.test('cost-center-sum-100', ...)` do schema) —
  // mesma leitura de `arrayError` em `ApportionmentsSection` de CostCenter:
  // `errors.cost_centers` é `Merge<FieldError, ...[]>`, tem `.message` próprio
  // (nível array) além de ser indexável por linha. É ESTE erro que, ao
  // reprovar no resolver do pai, impede o submit de verdade (ver cabeçalho).
  const sumError = errors.cost_centers?.message as string | undefined;

  return (
    <Box pt={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" color="fg.muted">
          {text.sections.costCenterApportionmentSum}
        </Text>

        {fields.length > 0 && (
          <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
            {totalPercentage.toFixed(2)}%
          </Badge>
        )}
      </Flex>

      {sumError && (
        <Text fontSize="xs" color="fg.error" mb={4}>
          {sumError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.costCenterRow.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-end" wrap="wrap">
              <Box flex="1" minW="240px">
                <Controller
                  name={`cost_centers.${index}.cost_center_uuid`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={text.fields.costCenter}
                      placeholder={text.placeholders.costCenter}
                      service={listCostCenterOptions}
                      mapOptions={(item: { uuid: string; code: string; description: string }) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        only_analytic: true,
                      })}
                      value={rowField.value ? costCenterOptionsCache[rowField.value] : undefined}
                      onChange={(option: any) => {
                        rowField.onChange(option?.value ?? null);
                        if (option) handlePickCostCenterOption(option as Option<string>);
                      }}
                      error={fieldState.error?.message}
                      isRequired
                      isDisabled={isDisabled}
                      // AJUSTE 3(b) do E2E do dev (execução 026) — mesmo fix de
                      // CreateOrUpdateCategoriaAnimal.tsx/CreateOrUpdateRaca.tsx: SEM
                      // `menuPortalTarget`, o menu do `react-select` renderiza
                      // `position: absolute` preso ao container do form (a linha do
                      // rateio fica perto do rodapé fixo da tela) e é recortado por ele.
                      // Convenção do fork: TODO `SelectAsyncPaginate` do projeto já
                      // portaliza para `document.body` — esta linha ficou de fora na
                      // TASK-FE-1008 original (omissão, não decisão). Faltava só aqui;
                      // as demais 4 abas de Inventário já portalizam corretamente.
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '180px' }}>
                <Controller
                  name={`cost_centers.${index}.percentage`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <NumberInput
                      name={rowField.name}
                      label={text.fields.percentage}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      min={0}
                      max={100}
                      allowDot
                      decimalPlaces={2}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <IconButtonTable
                aria-label={text.costCenterRow.removeButton}
                mensegerTooltip={text.costCenterRow.removeButton}
                size="sm"
                color="red.500"
                variant="ghost"
                disabled={isDisabled}
                onClick={() => remove(index)}
              >
                <Icon as={FiTrash2} />
              </IconButtonTable>
            </Flex>
          ))}
        </Flex>
      )}

      <Button
        title={text.costCenterRow.addButton}
        icon={FiPlus as ElementType}
        variant="outline"
        onClick={() => append({ cost_center_uuid: null, percentage: null })}
        disabled={isDisabled}
      />
    </Box>
  );
}
