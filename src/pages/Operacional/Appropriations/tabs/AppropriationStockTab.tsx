// src/pages/Operacional/Appropriations/tabs/AppropriationStockTab.tsx
// -----------------------------------------------------------------------------
// Aba "Insumos" — TASK-FE-2709. `useFieldArray` de `stock_items`: Armazém +
// Produto + Qtd/ha + Un. Medida, mirror `AppropriationLaborTab.tsx`/
// `EquipamentoRateioCentroCustoTab.tsx`.
//
// Contrato real (`AppropriationStockItemData`, JÁ CONSTRUÍDO):
// `product_uuid`/`warehouse_uuid`/`quantity`/`measurement_uuid`/
// `total_quantity` (opcional — v1.1 §19-E3, interpretação A,
// `measurement_uuid` resolve `product_um` server-side; `total_quantity`
// GAP-BE-601/TASK-BE-1001, execução 034 — "Qtd Total" real calculada no
// Front, fallback backend `= quantity` quando ausente).
//
// TASK-FE-604/AP-05 (Fase 1, achado da re-E2E) — 2 mudanças SEM dependência
// de backend: (1) gate de sequência — Produto desabilitado/vazio POR LINHA
// até o Armazém daquela linha ser escolhido, trocar o Armazém limpa o
// Produto da mesma linha (mirror `TASK-FE-601`/AP-02, mesmo mecanismo); (2)
// "Qtd Total" calculada AO VIVO (`quantity × used_area`, cabeçalho), mesma
// fórmula/mecânica de `TASK-FE-602`/AP-03 (`AppropriationLaborTab.tsx`).
//
// TASK-FE-605/AP-05 (Fase 2, execução 034 — endpoint novo `GET /stocks?
// warehouse_uuid=` entregue pelo Executor API) — o CATÁLOGO do Select
// "Produto" desta linha passa a ser `listStockAvailability` (saldo real por
// armazém, `StockAvailabilityResource`), substituindo o `listProducts`
// geral da Fase 1 — fiel ao legado (`_product.blade.php:118-159`, "Produtos
// só carregam depois de escolher o Armazém" filtra o CATÁLOGO, não só
// habilita o campo). Cada option já embute `quantity` (mirror
// `productive_area` embutido na option de Área, `CreateOrUpdateAppropriation.
// tsx`) — a coluna "Estoque" lê direto da option selecionada, SEM `useQuery`
// extra por linha (decisão do Executor: 1 fetch por Select já cobre catálogo
// + saldo, evita N chamadas simultâneas que o Roteiro alertou). "Qtd Total"
// (`liveTotalQuantity`, já calculada) agora TAMBÉM é enviada no payload
// (`stock_items[].total_quantity`, TASK-BE-1001) — deixou de ser só
// informativo de tela.
//
// TASK-FE-701 (AP-32, execução 034) — validação de estoque no `onBlur` de
// "Qtd/ha": se `liveTotalQuantity` (Qtd Total) ultrapassar a quantidade em
// estoque do item (mesma fonte de "Estoque", `productOption.quantity`), abre
// `StockQuantityExceedsWarningDialog` (mirror texto do legado,
// `_product.blade.php:45-79`) e zera "Qtd/ha" (que já deriva "Qtd Total" a 0,
// campo readonly).
//
// TASK-FE-734 (execução 034/035, GAP-BE-655) — máscara da Finalização
// (`FinishAppropriation.tsx`, TASK-FE-737): 2 props novas, opcionais/default
// `false` (mirror EXATO `AppropriationLaborTab.tsx`/TASK-FE-732):
// `lockIdentityFields`/`hideRowActions`. Quando `lockIdentityFields=true`:
// Armazém/Produto/Un.Medida (identidade, `_card_product_edit.blade.php:5,13,
// 19` `readonly`/`->readonly()`) viram `InputReadOnly`; "Qtd Total"
// (`total_quantity`) deixa de ser `InputReadOnly` puramente derivada — vira
// `Controller`+`NumberInput` editável, DEFAULT `= quantity × used_area`
// recalculado ao vivo até o usuário editar manualmente (mirror EXATO
// `AppropriationLaborTab.tsx`/`LaborItemRow`, `totalQuantityTouchedRef`/
// `isFirstRender`, GAP-BE-650/TASK-FE-686) — por isso o `.map()` inline
// virou o componente `StockItemRow` (hooks `useRef`/`useEffect` por linha
// exigem 1 componente por linha, Rules of Hooks, mirror `LaborItemRow`/
// `ProductionItemRow`). Fora do modo Finalização (`lockIdentityFields=false`,
// default), COMPORTAMENTO 100% IDÊNTICO ao anterior — "Qtd Total" continua
// `InputReadOnly` derivada, sem `useEffect` sobrescrevendo nada (o efeito só
// roda quando `lockIdentityFields` é `true`). A conversão por fator M/D
// ("Estoque", TASK-FE-714) é inalterada nos 2 modos.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listStockAvailability } from '@/services/v2/Stocks/stock-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { AppropriationForm } from '@/@types/v2/Appropriations';
import type { StockAvailabilityItem } from '@/@types/v2/Stocks';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { StockQuantityExceedsWarningDialog } from './StockQuantityExceedsWarningDialog';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface AppropriationStockTabProps {
  control: Control<AppropriationForm>;
  errors: FieldErrors<AppropriationForm>;
  watch: UseFormWatch<AppropriationForm>;
  setValue: UseFormSetValue<AppropriationForm>;
  isLoading: boolean;
  canSave: boolean;
  // TASK-FE-610/AP-09 — banner "≥1 item" agora lido de estado do componente
  // pai (setado só no onSubmit), não mais de `errors.stock_items?.message`.
  itemsError: string | null;
  /** TASK-FE-734 (GAP-BE-655) — `true` só na Finalização: Armazém/Produto/
   *  Un.Medida travam como `InputReadOnly`; "Qtd Total" vira editável.
   *  Default `false`/`undefined` preserva `CreateOrUpdateAppropriation.tsx`
   *  100% inalterado. */
  lockIdentityFields?: boolean;
  /** TASK-FE-734 — `true` esconde "+ Adicionar Item" e a lixeira (mirror
   *  `AppropriationLaborTab.tsx`/TASK-FE-732). */
  hideRowActions?: boolean;
}

export function AppropriationStockTab({
  control,
  errors,
  watch,
  setValue,
  isLoading,
  canSave,
  itemsError,
  lockIdentityFields = false,
  hideRowActions = false,
}: AppropriationStockTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.appropriations.appropriation.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'stock_items' });

  const isDisabled = !canSave || isLoading;

  // TASK-FE-701 (AP-32, execução 034) — modal de aviso quando "Qtd Total"
  // (quantity × área produtiva) ultrapassa a quantidade em estoque do item,
  // mirror mecânica/texto do legado (`_product.blade.php:45-79`).
  const [stockWarning, setStockWarning] = useState<{
    informedQuantity: number;
    productiveArea: number;
    stockQuantity: number;
  } | null>(null);

  function handleAdd() {
    append({
      product_uuid: null,
      warehouse_uuid: null,
      quantity: null,
      measurement_uuid: null,
      total_quantity: null,
    });
  }

  function handleQuantityBlur(index: number) {
    const usedArea = Number(watch('used_area')) || 0;
    const quantity = Number(watch(`stock_items.${index}.quantity`)) || 0;
    const productOption = watch(`stock_items.${index}.product_uuid`) as
      (Option<string> & { quantity?: number }) | null | undefined;

    if (productOption?.quantity === undefined) return;

    const stockQuantity = Number(productOption.quantity);
    const total = quantity * usedArea;

    if (total > stockQuantity) {
      setStockWarning({ informedQuantity: quantity, productiveArea: usedArea, stockQuantity });
      setValue(`stock_items.${index}.quantity`, 0);
    }
  }

  return (
    <Box pt={4}>
      {itemsError && (
        <Text fontSize="xs" color="fg.error" mb={2}>
          {itemsError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {formText.emptyRow}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <StockItemRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isDisabled={isDisabled}
              lockIdentityFields={lockIdentityFields}
              hideRowActions={hideRowActions}
              onQuantityBlur={() => handleQuantityBlur(index)}
              onRemove={() => remove(index)}
            />
          ))}
        </Flex>
      )}

      {!hideRowActions && (
        <Button
          title={formText.addItem}
          icon={FiPlus as ElementType}
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={isDisabled}
        />
      )}

      <StockQuantityExceedsWarningDialog
        isOpen={!!stockWarning}
        onClose={() => setStockWarning(null)}
        informedQuantity={stockWarning?.informedQuantity ?? 0}
        productiveArea={stockWarning?.productiveArea ?? 0}
        stockQuantity={stockWarning?.stockQuantity ?? 0}
      />
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Linha de item — componente próprio (TASK-FE-734), mirror EXATO
// `LaborItemRow`/`ProductionItemRow`: necessário para o `useEffect`/`useRef`
// do default de "Qtd Total" (só ativo quando `lockIdentityFields=true`) sem
// violar Rules of Hooks dentro do `.map()` de `useFieldArray`.
// -----------------------------------------------------------------------------

interface StockItemRowProps {
  index: number;
  control: Control<AppropriationForm>;
  errors: FieldErrors<AppropriationForm>;
  watch: UseFormWatch<AppropriationForm>;
  setValue: UseFormSetValue<AppropriationForm>;
  isDisabled: boolean;
  lockIdentityFields: boolean;
  hideRowActions: boolean;
  onQuantityBlur: () => void;
  onRemove: () => void;
}

function StockItemRow({
  index,
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  lockIdentityFields,
  hideRowActions,
  onQuantityBlur,
  onRemove,
}: StockItemRowProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.appropriations.appropriation.form;

  const rowErrors = errors.stock_items?.[index];
  const quantity = Number(watch(`stock_items.${index}.quantity`)) || 0;
  const usedArea = Number(watch('used_area')) || 0;
  const liveTotalQuantity = quantity * usedArea;

  // TASK-FE-734 (GAP-BE-655) — "Qtd Total" (`total_quantity`) ganha DEFAULT
  // `= quantity × used_area` recalculado ao vivo, mas para de recalcular
  // assim que o usuário editar manualmente ESTA linha — mirror EXATO
  // `AppropriationLaborTab.tsx`/`LaborItemRow` (GAP-BE-650/TASK-FE-686). Só
  // ativo quando `lockIdentityFields=true` (Finalização); fora dela, "Qtd
  // Total" nunca é um campo RHF tocado por este efeito (permanece
  // `InputReadOnly` derivada, ver JSX abaixo) — zero regressão em
  // create/edit.
  const totalQuantityTouchedRef = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!lockIdentityFields) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (totalQuantityTouchedRef.current) return;
    setValue(`stock_items.${index}.total_quantity`, quantity * usedArea, {
      shouldValidate: false,
    });
  }, [lockIdentityFields, quantity, usedArea]);

  // TASK-FE-714 (AP-31, GAP-BE-642, execução 034, 6ª leva) — conversão por
  // fator sobre "Estoque", DIREÇÃO INSUMOS (`_product.blade.php:203-216`,
  // Doc Bruta 07 §9/§11.5): OPOSTA à de Produção (`TASK-FE-713`) por decisão
  // explícita do dono, preservada — `factor_type='M'` MULTIPLICA aqui, `'D'`
  // DIVIDE (o inverso de `AppropriationProductionTab.tsx`). Só converte
  // quando a Un. Medida escolhida NESTA linha é a SECUNDÁRIA do produto
  // (nativa = sem conversão); sem `factor`/`factor_type` cadastrado, cai no
  // bruto (nunca quebra a tela). Inalterado pela máscara de Finalização.
  const productOption = watch(`stock_items.${index}.product_uuid`) as
    | (Option<string> & {
        quantity?: number;
        measurement?: Option<string> | null;
        measurementSecond?: Option<string> | null;
        factor?: number | null;
        factorType?: 'M' | 'D' | null;
      })
    | null
    | undefined;
  const selectedMeasurementUuid = (
    watch(`stock_items.${index}.measurement_uuid`) as Option<string> | null | undefined
  )?.value;
  const rawStockQuantity =
    productOption?.quantity !== undefined ? Number(productOption.quantity) : null;

  const convertInsumoStock = (raw: number): number => {
    const nativeMeasurementUuid = productOption?.measurement?.value;
    const isNativeMeasurement =
      !selectedMeasurementUuid || selectedMeasurementUuid === nativeMeasurementUuid;
    if (isNativeMeasurement) return raw;

    const factor = productOption?.factor;
    const factorType = productOption?.factorType;
    if (!factor || factor <= 0) return raw;

    if (factorType === 'M') return raw * factor;
    if (factorType === 'D') return raw / factor;
    return raw;
  };

  const stockDisplayValue =
    rawStockQuantity !== null
      ? convertInsumoStock(rawStockQuantity).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '—';

  const measurementOptions = Array.from(
    new Map(
      [productOption?.measurement, productOption?.measurementSecond]
        .filter((option): option is Option<string> => Boolean(option))
        .map((option) => [option.value, option])
    ).values()
  );

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`stock_items.${index}.warehouse_uuid`}
          control={control}
          render={({ field: rowField }) =>
            lockIdentityFields ? (
              <InputReadOnly
                label={formText.stock.fields.warehouse}
                value={rowField.value?.label ?? '—'}
              />
            ) : (
              <SelectAsyncPaginate
                name={rowField.name}
                label={formText.stock.fields.warehouse}
                placeholder={formText.stock.placeholders.warehouse}
                error={rowErrors?.warehouse_uuid?.message as string | undefined}
                service={listWarehouseOptions}
                mapOptions={(item: WarehouseOption) => ({
                  label: `${item.initials} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  // TASK-FE-611/AP-08 (GAP-BE-610/TASK-BE-1003) — só Armazéns
                  // de tipo Insumos aparecem na aba Insumos.
                  type: 'insumos',
                })}
                value={rowField.value ?? undefined}
                onChange={(option: any) => {
                  rowField.onChange(option ?? null);
                  // CASCATA (AP-05, mirror AP-02) — trocar o Armazém desta
                  // linha limpa o Produto da MESMA linha (evita produto de
                  // contexto errado); TASK-FE-663/AP-24 — limpa também a Un.
                  // Medida derivada (dependente do Produto, ver Controller
                  // abaixo).
                  setValue(`stock_items.${index}.product_uuid`, null);
                  setValue(`stock_items.${index}.measurement_uuid`, null);
                }}
                isRequired
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )
          }
        />

        <Controller
          name={`stock_items.${index}.product_uuid`}
          control={control}
          render={({ field: rowField }) =>
            lockIdentityFields ? (
              <InputReadOnly
                label={formText.stock.fields.product}
                value={rowField.value?.label ?? '—'}
              />
            ) : (
              <SelectAsyncPaginate
                name={rowField.name}
                label={formText.stock.fields.product}
                placeholder={formText.stock.placeholders.product}
                error={rowErrors?.product_uuid?.message as string | undefined}
                service={listStockAvailability}
                // Catálogo escopado pelo Armazém desta linha (TASK-FE-605/
                // AP-05 Fase 2) — só produtos com saldo >0 naquele armazém
                // aparecem (mirror legado). `id` NÃO existe aqui (Lei 10) —
                // `quantity`/`measurement` embutidos na option alimentam
                // "Estoque"/"Un. Medida" abaixo, sem round-trip.
                mapOptions={(item: StockAvailabilityItem) => ({
                  label: item.product.description,
                  value: item.product.uuid,
                  quantity: item.quantity,
                  // TASK-FE-751 (destravada por ERRO-BE-018) — `description`
                  // (texto completo) no lugar de `name` (abreviação),
                  // paridade com `ProductOption` (que já usa `description`
                  // na Produção); fallback por segurança.
                  measurement: item.measurement
                    ? {
                        label: item.measurement.description || item.measurement.name,
                        value: item.measurement.uuid,
                      }
                    : null,
                  // TASK-FE-700 (AP-31, GAP-BE-642, execução 034, 6ª leva) —
                  // 2ª unidade do Produto, mirror `measurement` acima;
                  // alimenta o dedupe do Select "Un. Medida" (abaixo).
                  measurementSecond: item.measurement_second
                    ? {
                        label: item.measurement_second.description || item.measurement_second.name,
                        value: item.measurement_second.uuid,
                      }
                    : null,
                  // TASK-FE-714 (AP-31, GAP-BE-642) — fator/tipo do Produto,
                  // embutidos na option (sem round-trip extra) para
                  // converter "Estoque" quando a Un. Medida escolhida na
                  // linha for a SECUNDÁRIA.
                  factor: item.factor ?? null,
                  factorType: item.factor_type ?? null,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  warehouse_uuid: watch(`stock_items.${index}.warehouse_uuid`)?.value,
                  // ANTI-REGRESSÃO (GAP-BE-632, opção b) — `/stocks` deixou
                  // de aplicar `allow_pointing=true` por default; Insumos
                  // precisa enviar explicitamente (mirror `_product.blade.
                  // php`, sempre `allow_pointing=1`) para não listar produto
                  // não-apontável.
                  allow_pointing: true,
                })}
                // Descarta o cache quando o Armazém muda — mesma correção de
                // `CreateOrUpdateAppropriation.tsx` (Operação→Atividade)/
                // `CreateOrUpdateProduto.tsx`.
                cacheUniqs={[watch(`stock_items.${index}.warehouse_uuid`)?.value]}
                value={rowField.value ?? undefined}
                onChange={(option: any) => {
                  rowField.onChange(option ?? null);
                  // TASK-FE-663/AP-24 (Fase 2) — Un. Medida deixa de ser
                  // catálogo genérico e passa a ser DERIVADA da option do
                  // Produto (`measurement`/`measurementSecond` embutidos por
                  // `listStockAvailability`).
                  // TASK-FE-700 (AP-31, GAP-BE-642) — dedupe por uuid (mirror
                  // EXATO `AppropriationProductionTab.tsx:588-598`): com as 2
                  // unidades IGUAIS ou só 1 cadastrada, resta 1 opção e
                  // auto-seleciona; com 2 distintas, fica vazia para escolha
                  // manual.
                  const dedupedMeasurements = Array.from(
                    new Map(
                      [option?.measurement, option?.measurementSecond]
                        .filter((candidate): candidate is Option<string> => Boolean(candidate))
                        .map((candidate) => [candidate.value, candidate])
                    ).values()
                  );
                  setValue(
                    `stock_items.${index}.measurement_uuid`,
                    dedupedMeasurements.length === 1 ? dedupedMeasurements[0] : null
                  );
                }}
                isRequired
                // Gate de sequência (AP-05, Fase 1) — Produto só habilita
                // após o Armazém DESTA linha ser escolhido.
                isDisabled={isDisabled || !watch(`stock_items.${index}.warehouse_uuid`)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )
          }
        />

        {/* "Un. Medida" — TASK-FE-663 (AP-24)/TASK-FE-700. TASK-FE-734 —
            trava como `InputReadOnly` na Finalização (identidade da linha,
            mirror `_card_product_edit.blade.php:19` `->readonly()`). */}
        <Controller
          name={`stock_items.${index}.measurement_uuid`}
          control={control}
          render={({ field: rowField }) =>
            lockIdentityFields ? (
              <InputReadOnly
                label={formText.stock.fields.measurement}
                value={rowField.value?.label ?? '—'}
              />
            ) : (
              <Select
                name={rowField.name}
                label={formText.stock.fields.measurement}
                placeholder={formText.stock.placeholders.measurement}
                value={rowField.value ?? null}
                onChange={(option) => rowField.onChange(option ?? null)}
                options={measurementOptions}
                noClearable
                // TASK-FE-700 — trava quando restar 1 única opção após
                // dedupe (mirror auto-trava de Produção).
                isDisabled={isDisabled || measurementOptions.length <= 1}
              />
            )
          }
        />

        <Controller
          name={`stock_items.${index}.quantity`}
          control={control}
          render={({ field: rowField }) => (
            <NumberInput
              name={rowField.name}
              label={formText.stock.fields.quantity}
              allowDot
              decimalPlaces={2}
              value={rowField.value ?? null}
              onValueChange={(value) => rowField.onChange(value)}
              onBlur={onQuantityBlur}
              error={rowErrors?.quantity?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        {/* "Qtd Total" — create/edit (`lockIdentityFields=false`): derivado
            de TELA (`quantity × used_area`), `InputReadOnly`, ENVIADO no
            payload desde TASK-FE-605, COMPORTAMENTO INALTERADO. Finalização
            (`lockIdentityFields=true`, TASK-FE-734/GAP-BE-655): promovida a
            `Controller`+`NumberInput` editável, DEFAULT recalculado ao vivo
            até o usuário editar manualmente esta linha (ver `useEffect`
            acima). */}
        {lockIdentityFields ? (
          <Controller
            name={`stock_items.${index}.total_quantity`}
            control={control}
            render={({ field: rowField }) => (
              <NumberInput
                name={rowField.name}
                label={formText.stock.fields.totalQuantity}
                allowDot
                decimalPlaces={2}
                value={rowField.value ?? null}
                onValueChange={(value) => {
                  totalQuantityTouchedRef.current = true;
                  rowField.onChange(value);
                }}
                disabled={isDisabled}
              />
            )}
          />
        ) : (
          <InputReadOnly
            label={formText.stock.fields.totalQuantity}
            value={liveTotalQuantity.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          />
        )}

        {/* "Estoque" (TASK-FE-605/AP-05 Fase 2) — saldo do Produto NESTE
            Armazém, lido direto da option selecionada (`quantity` embutida
            por `listStockAvailability`), SEM chamada de rede extra.
            TASK-FE-714 (GAP-BE-642) — aplica conversão por fator (direção
            Insumos) quando a Un. Medida escolhida é a secundária. Sem
            Produto escolhido: "—". Inalterado pela máscara de Finalização. */}
        <InputReadOnly label={formText.stock.fields.stock} value={stockDisplayValue} />
      </SimpleGrid>

      {!hideRowActions && (
        <Flex justify="flex-end" mt={3}>
          <IconButtonTable
            aria-label={formText.removeItem}
            mensegerTooltip={formText.removeItem}
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
