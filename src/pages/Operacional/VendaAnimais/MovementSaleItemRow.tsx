// src/pages/Operacional/VendaAnimais/MovementSaleItemRow.tsx
// -----------------------------------------------------------------------------
// Linha do repeater de Itens (animais) da Venda de Animais — TASK-VD-FE-02,
// contrato de tela §7.2/§7.4. Mirror EXATO `RomaneioItemRow.tsx` (Operacional/
// Romaneios) — recebe `control`/`index`/`watch`/`setValue`/`errors`/
// `isDisabled` por prop, NÃO instancia o próprio `useFieldArray` (contrato
// §"Estado", GAP-TRF-FE-02 aprovado, mesma regra aqui).
//
// ⚠️ Achado de fidelidade (confirmado contra `GetAnimalsByBatchAction`/
// `AnimalOptionResource` reais, `GB.Cerne.Api`) — DIVERGE do contrato de
// tela §7.2/§7.4 ("previous_weight_kg/data de entrada embutidos na própria
// option de busca, sem request extra"): `GET /movement-sales/animal-by-batch`
// devolve SÓ `{uuid, identification, category}` (`category` é a DESCRIÇÃO,
// texto — nunca `category_uuid`), sem peso/data de entrada. Ao SELECIONAR um
// animal, esta linha faz 1 chamada adicional (`getAnimalByUuid`,
// `animal-service.ts`, já existente, gate `animals_view`) para resolver
// `category.uuid` (exigido no payload) + `weight`/`entry_date` (cálculo de
// `gain`/`gmd`). Ajuste de tipo/comportamento, não Gap (contrato §4,
// "confirmar contra o código real antes de fixar os tipos").
//
// `gain`/`gmd`: mirror literal do padrão `isFirstRender` de
// `RomaneioItemRow.tsx:120-138` — nunca recalcula no 1º render (preserva o
// valor hidratado do servidor em edição). Sem o 2º guard (`skipNextTotalRecalc`)
// de Romaneios: lá ele existe porque `total_amount`⇄`amount` é BIDIRECIONAL
// (o usuário edita os 2 lados); aqui `gain`/`gmd` são SEMPRE readonly —
// não há edição reversa para "pular", então o guard duplo seria morto.
//
// Lookup de animal (contrato §7.4, unificação IG1+IG2 sobre `L8`):
//   - `batch_sale=true` (lote selecionado) → `listMovementSaleAnimalsByBatch`
//     (endpoint próprio da feature, `batch_uuid` obrigatório na API real —
//     por isso NÃO pode ser usado em modo individual sem lote, divergência
//     do contrato também registrada acima).
//   - `batch_sale=false` (individual, sem lote) → `listAnimalOptions`
//     (`/animals/options`, catálogo geral paginado, já existente) — busca
//     livre por texto, mirror do racional de IG2 do contrato (com o
//     endpoint real disponível, não o `L8` que exige lote).
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

import { Box, Flex, Icon, SimpleGrid } from '@chakra-ui/react';
import { isValid, parseISO } from 'date-fns';
import { Controller } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { getAnimalByUuid, listAnimalOptions } from '@/services/v2/Animals/animal-service';
import { listMovementSaleAnimalsByBatch } from '@/services/v2/MovementSales/movement-sale-service';

import type { Option } from '@/@types/option';
import type { ResponsePagination } from '@/@types/response-api';
import type { MovementSaleForm } from '@/@types/v2/MovementSales';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface MovementSaleItemRowProps {
  index: number;
  control: Control<MovementSaleForm>;
  errors: FieldErrors<MovementSaleForm>;
  watch: UseFormWatch<MovementSaleForm>;
  setValue: UseFormSetValue<MovementSaleForm>;
  isDisabled: boolean;
  onRemove: () => void;
  /** TASK-VD-FE-03 (contrato §8, mirror `FinishAppropriation.tsx`
   *  `lockIdentityFields`) — `true` na Finalização de abate: `animal`/
   *  `categoria`/`peso` viram somente-leitura (o item já está fechado desde
   *  a criação da venda); só `carcass_weight`/`performance` continuam
   *  editáveis. Default `false` preserva 100% o comportamento do form
   *  principal (Tarefa 15). */
  lockIdentityFields?: boolean;
  /** Esconde o botão de remover linha (Finalização não adiciona/remove
   *  itens). Default `false`. */
  hideRowActions?: boolean;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

interface FlatAnimalOption {
  uuid: string;
  label: string;
}

async function fetchBatchAnimalOptions(
  batchUuid: string
): Promise<ResponsePagination<FlatAnimalOption[]>> {
  const response = await listMovementSaleAnimalsByBatch({ batch_uuid: batchUuid });
  const items = (response.data ?? []).map((animal) => ({
    uuid: animal.uuid,
    label: animal.identification ?? animal.uuid,
  }));

  return {
    success: response.success,
    message: response.message,
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: items.length || 1,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

async function fetchFreeAnimalOptions(params: {
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<ResponsePagination<FlatAnimalOption[]>> {
  const response = await listAnimalOptions(params);
  return {
    success: response.success,
    message: response.message,
    data: {
      items: response.data.items.map((item) => ({ uuid: item.uuid, label: item.label })),
      pagination: response.data.pagination,
    },
  };
}

export function MovementSaleItemRow({
  index,
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  onRemove,
  lockIdentityFields = false,
  hideRowActions = false,
}: MovementSaleItemRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.movementSales.movementSale.form.itemRow;

  const rowErrors = errors.items?.[index];

  const batchSale = watch('batch_sale');
  const batchUuid = watch('batch_uuid')?.value;
  const dtSale = watch('dt_sale');

  // ---- gain/gmd — mirror `RomaneioItemRow.tsx:120-138` (só o guard
  // `isFirstRender`, ver nota de cabeçalho sobre o 2º guard omitido). -------
  // VD-FE-02 (PARADA-FE-5/DIV-FE-2 aprovado — dono aceitou o default
  // "corrigir CV-002"): `days = ceil((dt_sale-entry_date)/86400000)`,
  // substituindo `differenceInCalendarDays`+piso `Math.max(1,…)` (divergia
  // em frações de dia e em venda no mesmo dia da entrada, que o legado
  // conta como 0 dias — não 1). O piso de 1 permanece SÓ como guarda de
  // divisão por zero do `gmd` (CV-003: "guard usa divisor 1 quando
  // necessário"), nunca alterando o valor de `days` em si.
  const isFirstRender = useRef(true);
  const weightKg = Number(watch(`items.${index}.weight_kg`)) || 0;
  const previousWeightKg = Number(watch(`items.${index}.previous_weight_kg`)) || 0;
  const entryDate = watch(`items.${index}.entry_date`);
  const carcassWeight = Number(watch(`items.${index}.carcass_weight`)) || 0;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!entryDate || !dtSale) return;

    const entry = parseISO(entryDate);
    const sale = parseISO(dtSale);
    if (!isValid(entry) || !isValid(sale)) return;

    const gain = round(weightKg - previousWeightKg, 2);
    const days = Math.ceil((sale.getTime() - entry.getTime()) / 86400000);
    const gmdDivisor = days > 0 ? days : 1;
    const gmd = round(gain / gmdDivisor, 3);

    setValue(`items.${index}.gain`, gain, { shouldValidate: false });
    setValue(`items.${index}.gmd`, gmd, { shouldValidate: false });
  }, [weightKg, previousWeightKg, entryDate, dtSale]);

  // ---- performance (CV-017, FALTA-C) — auto-cálculo no abate
  // (`lockIdentityFields`): `carcass_weight*100/peso_vivo`, 2 casas,
  // recalcula a cada mudança de `carcass_weight` (ou do peso vivo já
  // hidratado). Fora do abate, o campo permanece editável — comportamento
  // preexistente (TASK-VD-FE-03) inalterado, sem regressão. -------------
  useEffect(() => {
    if (!lockIdentityFields) return;
    if (!carcassWeight || !weightKg) return;

    const performance = round((carcassWeight * 100) / weightKg, 2);
    setValue(`items.${index}.performance`, performance, { shouldValidate: true });
  }, [carcassWeight, weightKg, lockIdentityFields]);

  // ---- Hidratação de category/peso/entrada ao selecionar o animal --------
  // VD-FE-02 (contrato §3.2 FALTA-B / IG-008): selecionar um `animal_uuid`
  // já presente em OUTRA linha do repeater dispara toast + limpa a seleção
  // SÓ da linha atual (nunca as demais, nunca persiste o duplicado).
  async function handleAnimalChange(option: Option<string> | null) {
    if (!option) {
      setValue(`items.${index}.animal_uuid`, null, { shouldValidate: true });
      setValue(`items.${index}.category_uuid`, null);
      setValue(`items.${index}.previous_weight_kg`, null);
      setValue(`items.${index}.entry_date`, null);
      return;
    }

    const currentItems = watch('items') ?? [];
    const isDuplicate = currentItems.some(
      (item, itemIndex) => itemIndex !== index && item?.animal_uuid?.value === option.value
    );
    if (isDuplicate) {
      toaster.error({
        title: text.duplicateAnimalTitle,
        description: text.duplicateAnimalError,
      });
      setValue(`items.${index}.animal_uuid`, null, { shouldValidate: true });
      return;
    }

    setValue(
      `items.${index}.animal_uuid`,
      { label: option.label, value: option.value },
      { shouldValidate: true }
    );

    try {
      const detail = await getAnimalByUuid(option.value);
      const animal = detail.data;
      setValue(
        `items.${index}.category_uuid`,
        animal.category ? { label: animal.category.label, value: animal.category.uuid } : null,
        { shouldValidate: true }
      );
      setValue(`items.${index}.previous_weight_kg`, animal.weight ?? null);
      setValue(`items.${index}.entry_date`, animal.entry_date ?? null);
      // Semeia `weight_kg` com o peso atual do animal (ponto de partida
      // honesto — o usuário ajusta se o peso de venda for diferente).
      setValue(`items.${index}.weight_kg`, animal.weight ?? null, { shouldValidate: true });
    } catch {
      // Lookup de detalhe indisponível (403/erro de rede) — degrada
      // graciosamente: o animal fica selecionado, mas category/peso
      // anterior/gain/gmd permanecem vazios (SEM MOCK, nunca fabricado).
      setValue(`items.${index}.category_uuid`, null);
      setValue(`items.${index}.previous_weight_kg`, null);
      setValue(`items.${index}.entry_date`, null);
    }
  }

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        {lockIdentityFields ? (
          <Box gridColumn={{ base: 'auto', lg: 'span 2' }}>
            <InputReadOnly
              label={text.fields.animal}
              value={watch(`items.${index}.animal_uuid`)?.label ?? '—'}
            />
          </Box>
        ) : (
          <Box gridColumn={{ base: 'auto', lg: 'span 2' }}>
            <Controller
              name={`items.${index}.animal_uuid`}
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  key={batchSale ? `batch-${batchUuid ?? 'none'}` : 'free'}
                  name={field.name}
                  label={text.fields.animal}
                  placeholder={text.placeholders.animal}
                  error={rowErrors?.animal_uuid?.message as string | undefined}
                  service={
                    batchSale && batchUuid
                      ? () => fetchBatchAnimalOptions(batchUuid)
                      : fetchFreeAnimalOptions
                  }
                  mapOptions={(item: FlatAnimalOption) => ({ label: item.label, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => handleAnimalChange(option)}
                  isRequired
                  isDisabled={isDisabled || (batchSale && !batchUuid)}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          </Box>
        )}

        <InputReadOnly
          label={text.fields.category}
          value={watch(`items.${index}.category_uuid`)?.label ?? '—'}
        />

        <InputReadOnly
          label={text.fields.previousWeight}
          value={
            watch(`items.${index}.previous_weight_kg`) !== null &&
            watch(`items.${index}.previous_weight_kg`) !== undefined
              ? String(watch(`items.${index}.previous_weight_kg`))
              : text.noHistoryLabel
          }
        />

        {lockIdentityFields ? (
          <InputReadOnly
            label={text.fields.weight}
            value={
              watch(`items.${index}.weight_kg`) !== null &&
              watch(`items.${index}.weight_kg`) !== undefined
                ? String(watch(`items.${index}.weight_kg`))
                : '—'
            }
          />
        ) : (
          <Controller
            name={`items.${index}.weight_kg`}
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={text.fields.weight}
                allowDot
                decimalPlaces={2}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={rowErrors?.weight_kg?.message as string | undefined}
                isRequired
                disabled={isDisabled}
              />
            )}
          />
        )}

        <InputReadOnly
          label={text.fields.gain}
          value={
            watch(`items.${index}.gain`) !== null && watch(`items.${index}.gain`) !== undefined
              ? String(watch(`items.${index}.gain`))
              : '—'
          }
        />

        <InputReadOnly
          label={text.fields.gmd}
          value={
            watch(`items.${index}.gmd`) !== null && watch(`items.${index}.gmd`) !== undefined
              ? String(watch(`items.${index}.gmd`))
              : '—'
          }
        />

        <Controller
          name={`items.${index}.carcass_weight`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={text.fields.carcassWeight}
              allowDot
              decimalPlaces={2}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={rowErrors?.carcass_weight?.message as string | undefined}
              isRequired={lockIdentityFields}
              disabled={isDisabled}
            />
          )}
        />

        {/* `performance` (TASK-VD-FE-03, contrato §8) — `required|numeric` no
            `MovementSaleSlaughterRequest` real; aditivo ao form principal
            (`MovementSaleItemForm.performance` já existia no tipo, apenas sem
            Controller próprio — Tarefa 15 nunca o renderizava). Sempre
            visível (não só em `lockIdentityFields`) para o tipo não divergir
            entre os 2 modos.
            VD-FE-02 (contrato §3.2 FALTA-C / CV-017): no abate
            (`lockIdentityFields`), o campo é CALCULADO e readonly como no
            legado (`carcass_weight*100/peso_vivo`, useEffect acima); fora do
            abate, permanece o `NumberInput` editável preexistente
            (TASK-VD-FE-03), sem regressão. */}
        {lockIdentityFields ? (
          <InputReadOnly
            label={text.fields.performance}
            value={
              watch(`items.${index}.performance`) !== null &&
              watch(`items.${index}.performance`) !== undefined
                ? String(watch(`items.${index}.performance`))
                : '—'
            }
          />
        ) : (
          <Controller
            name={`items.${index}.performance`}
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={text.fields.performance}
                allowDot
                decimalPlaces={2}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={rowErrors?.performance?.message as string | undefined}
                isRequired={lockIdentityFields}
                disabled={isDisabled}
              />
            )}
          />
        )}

        <Controller
          name={`items.${index}.note`}
          control={control}
          render={({ field }) => (
            <Input
              label={text.fields.note}
              name={field.name}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              disabled={isDisabled}
            />
          )}
        />
      </SimpleGrid>

      {!hideRowActions && (
        <Flex justify="flex-end" mt={3}>
          <IconButtonTable
            aria-label={text.removeButton}
            mensegerTooltip={text.removeButton}
            size="sm"
            color="red.500"
            variant="ghost"
            disabled={isDisabled}
            onClick={onRemove}
          >
            <Icon as={FiTrash2} />
          </IconButtonTable>
        </Flex>
      )}
    </Box>
  );
}
