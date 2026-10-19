// src/pages/Administrativo/EntradaInsumos/EntradaInsumosItemsTab.tsx
// -----------------------------------------------------------------------------
// Editor de itens (multi-item, `useFieldArray` no PAI) de Entrada de
// Insumos — esteira 037, TASK-IE-FE-06. Mirror ESTRUTURAL reduzido de
// `InvoiceItemsTab.tsx` (SEM bloco de equipamento/XML/IPI/ICMS, exclusivos
// de Invoice). Cada linha: produto, unidade de medida, quantidade, valor
// unitário, valor total (EDITÁVEL, recálculo inverso — CORRECAO-R1/E4),
// "Gera Estoque?" (controla habilitação do armazém, mirror `IG-005`, e da
// apropriação — inverso, CORRECAO-R1/E5), armazém, tipo de apropriação
// (Select Agricultura/Pecuária, CORRECAO-R1/E5), lote do fornecedor/validade
// (condicionais a `has_lot` do produto, CORRECAO-R1/E3), cultivo, categoria
// financeira, centro de custo. Área/Lote(Rebanho) REMOVIDOS (CORRECAO-R1/E2
// — decisão do dono, fidelidade).
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';
import { inputEntryAppropriationTypeOptions } from '@/constants/inputEntries/options/appropriation-type-options';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listCultivationOptions } from '@/services/v2/Cultivation/cultivation-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { listInputEntryAppropriationTypeOptions } from '@/services/v2/InputEntries/input-entry-service';
import { listProducts } from '@/services/v2/Products/product-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { InputEntryCreateForm, InputEntryItemForm } from '@/@types/v2/InputEntries';
import type { ProductListItem } from '@/@types/v2/Products';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { buildMeasurementOptions, isLotLocked } from './entradaInsumosHydration';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface EntradaInsumosItemsTabProps {
  control: Control<InputEntryCreateForm>;
  errors: FieldErrors<InputEntryCreateForm>;
  watch: UseFormWatch<InputEntryCreateForm>;
  setValue: UseFormSetValue<InputEntryCreateForm>;
  isLoading: boolean;
  canSave: boolean;
}

function computeVlItems(items: InputEntryItemForm[]): number {
  return items.reduce((total, item) => {
    const quantity = Number(item?.quantity) || 0;
    const unitValue = Number(item?.unit_value) || 0;
    return total + quantity * unitValue;
  }, 0);
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function EntradaInsumosItemsTab({
  control,
  errors,
  watch,
  setValue,
  isLoading,
  canSave,
}: EntradaInsumosItemsTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.inputEntries.inputEntry.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const isDisabled = !canSave || isLoading;

  // F-084 item 3 (TASK-BE-1085/GAP-BE-684) — elegibilidade de "Tipo
  // Apropriação" por Centro de Custo do TENANT (não por linha) — 1 lookup
  // para a aba inteira, reusado por todas as linhas via prop. Mirror EXATO
  // `InvoiceItemsTab.tsx` (`appropriationTypeEligibilityQuery`). `value` do
  // endpoint é sempre STRING ("1"/"2") — nunca comparar com número.
  const appropriationTypeEligibilityQuery = useQuery({
    queryKey: ['input-entry-appropriation-type-eligibility'],
    queryFn: async () => {
      const response = await listInputEntryAppropriationTypeOptions();
      return response.data.map((option) => option.value);
    },
    staleTime: 5 * 60 * 1000,
  });

  const watchedItems = watch('items') ?? [];
  const vlItems = computeVlItems(watchedItems);

  const arrayError = (errors.items as any)?.message as string | undefined;

  function handleAdd() {
    append({
      product_uuid: null,
      measurement_uuid: null,
      quantity: null,
      unit_value: null,
      total_value: 0,
      generate_stock: true,
      warehouse_uuid: null,
      appropriation_type: null,
      provider_lot: '',
      shelf_life: null,
      cultivation_uuid: null,
      category_uuid: null,
      center_uuid: null,
    });
  }

  return (
    <Box pt={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        {formText.sections.items}
      </Text>

      {arrayError && (
        <Text fontSize="xs" color="fg.error" mb={2}>
          {arrayError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {formText.itemRow.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <EntradaInsumosItemRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isDisabled={isDisabled}
              onRemove={() => remove(index)}
              eligibleAppropriationTypeValues={appropriationTypeEligibilityQuery.data}
            />
          ))}
        </Flex>
      )}

      <Button
        title={formText.itemRow.addButton}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={isDisabled}
      />

      <Box mt={6}>
        <InputReadOnly
          label={formText.fields.totalValue}
          value={vlItems.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        />
      </Box>
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Linha de item.
// -----------------------------------------------------------------------------

interface EntradaInsumosItemRowProps {
  index: number;
  control: Control<InputEntryCreateForm>;
  errors: FieldErrors<InputEntryCreateForm>;
  watch: UseFormWatch<InputEntryCreateForm>;
  setValue: UseFormSetValue<InputEntryCreateForm>;
  isDisabled: boolean;
  onRemove: () => void;
  /** F-084 item 3 (TASK-BE-1085) — elegibilidade por Centro de Custo do
   *  tenant, vinda do lookup ÚNICO da aba (`appropriationTypeEligibilityQuery`
   *  em `EntradaInsumosItemsTab`). `undefined` enquanto carrega. */
  eligibleAppropriationTypeValues: string[] | undefined;
}

function EntradaInsumosItemRow({
  index,
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  onRemove,
  eligibleAppropriationTypeValues,
}: EntradaInsumosItemRowProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.inputEntries.inputEntry.form;

  const isFirstRender = useRef(true);

  const rowErrors = (errors.items as any)?.[index];
  const generateStock = watch(`items.${index}.generate_stock`);
  const quantity = Number(watch(`items.${index}.quantity`)) || 0;
  const unitValue = Number(watch(`items.${index}.unit_value`)) || 0;

  // CORRECAO-R1/E3 — `has_lot` do produto lido DIRETO da option corrente de
  // `product_uuid` (embutido pelo `mapOptions`, mirror `InvoiceItemsTab.tsx`
  // `hasLot`), SEM campo extra no form.
  // DEFEITO F-084 (correção pós-entrega) — mirror EXATO
  // `InvoiceItemsTab.tsx` TASK-FE-669/DF-26 (GAP-BE-641): `measurement`/
  // `measurementSecond` embutidos na própria option de Produto (ver
  // `mapOptions` do Controller de `product_uuid` abaixo), lidos aqui para
  // restringir as opções do Select de "Un. Medida" às 1-2 unidades DO
  // PRODUTO selecionado — antes listava o catálogo inteiro
  // (`listMeasurementOptions`, sem filtro).
  const productOption = watch(`items.${index}.product_uuid`) as
    | (Option<string> & {
        has_lot?: boolean;
        measurement?: Option<string> | null;
        measurementSecond?: Option<string> | null;
        financial_category?: Option<string> | null;
      })
    | null
    | undefined;
  const hasLot = !!productOption?.has_lot;
  // DD-078-07 (b) — item já gravado: lote e validade somente leitura.
  const lotLocked = isLotLocked(watch(`items.${index}.uuid`));
  const savedProviderLot = watch(`items.${index}.provider_lot`);
  const savedShelfLife = watch(`items.${index}.shelf_life`);
  const showProviderLot = hasLot || (lotLocked && !!savedProviderLot);
  const showShelfLife = hasLot || (lotLocked && !!savedShelfLife);

  // CORRECAO-R1/E4 — flag do ÚLTIMO campo editado pelo usuário (`quantity`/
  // `unit_value` vs. `total_value`) — evita o loop de recálculo: o cálculo
  // DIRETO (abaixo) só roda quando quem disparou a mudança NÃO foi o próprio
  // `total_value`.
  const lastEditedFieldRef = useRef<'quantity_or_unit' | 'total_value'>('quantity_or_unit');

  // Cálculo DIRETO — `quantity × unit_value → total_value` (preview
  // client-side, NUNCA enviado no payload, o servidor sempre recalcula,
  // CL-006).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (lastEditedFieldRef.current === 'total_value') return;
    setValue(`items.${index}.total_value`, roundTo2(quantity * unitValue), {
      shouldValidate: false,
    });
  }, [quantity, unitValue]);

  // CORRECAO-R1/E4 — Recálculo INVERSO: editar "V. Total(R$)" com
  // `quantity > 0` ajusta `unit_value = total_value / quantity` (4 casas).
  function handleTotalValueChange(nextValue: number | null) {
    lastEditedFieldRef.current = 'total_value';
    setValue(`items.${index}.total_value`, nextValue ?? 0, {
      shouldValidate: false,
      shouldDirty: true,
    });

    if (quantity > 0) {
      const nextUnitValue = Math.round(((nextValue ?? 0) / quantity) * 10000) / 10000;
      setValue(`items.${index}.unit_value`, nextUnitValue, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`items.${index}.product_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.product}
              placeholder={formText.placeholders.product}
              error={
                (rowErrors?.product_uuid?.message as string | undefined) ??
                (rowErrors?.uuid?.message as string | undefined)
              }
              helperText={lotLocked ? formText.hints.productLockedWhenSaved : undefined}
              service={listProducts}
              mapOptions={(item: ProductListItem) => ({
                label: item.code ? `${item.code} — ${item.description}` : item.description,
                value: item.uuid,
                // CORRECAO-R1/E3 — `has_lot` embutido na option (mirror
                // `InvoiceItemsTab.tsx`), lido DIRETO por `provider_lot`/
                // `shelf_life` abaixo, sem campo extra no form.
                has_lot: item.has_lot,
                // DEFEITO F-084 — embute as 1-2 unidades válidas DO PRODUTO
                // na própria option (`GET /products` já eager-load
                // `measurement`/`measurementSecond` via `ProductResource`,
                // GAP-BE-641 — mesmo campo já usado por `has_lot` acima, sem
                // endpoint novo). Mirror EXATO `InvoiceItemsTab.tsx`
                // TASK-FE-669/DF-26. O Select de "Un. Medida" abaixo lê
                // estes 2 campos da option corrente.
                measurement: item.measurement
                  ? { label: item.measurement.description, value: item.measurement.uuid }
                  : null,
                measurementSecond: item.measurement_second
                  ? {
                      label: item.measurement_second.description,
                      value: item.measurement_second.uuid,
                    }
                  : null,
                // F-084 item 2 (TASK-BE-1084/GAP-BE-683) — embute a
                // Categoria Financeira DEFAULT do produto na própria option
                // (`GET /products` já eager-load `financialCategory`, mesmo
                // campo já usado por `has_lot`/`measurement` acima, sem
                // endpoint novo). Lida DIRETO pelo `onChange` abaixo para
                // auto-preencher `category_uuid` (fiel ao legado).
                financial_category: item.financial_category
                  ? {
                      label: item.financial_category.description,
                      value: item.financial_category.uuid,
                    }
                  : null,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                // Cascata `product_change` (IG-004) — trocar de produto
                // reavalia Lt. Fornecedor/Validade: limpa quando o NOVO
                // produto não usa lote.
                if (!option?.has_lot) {
                  setValue(`items.${index}.provider_lot`, '', { shouldValidate: true });
                  setValue(`items.${index}.shelf_life`, null, { shouldValidate: true });
                }
                // F-084 item 2 — auto-preenche a Categoria Financeira do
                // item com a categoria DEFAULT do produto selecionado
                // (fiel ao legado), só quando o produto TEM categoria
                // default cadastrada (`financial_category` embutido acima).
                // Sem categoria default, NÃO preenche (nem limpa o que já
                // estava selecionado) — decisão explícita do roteiro.
                if (option?.financial_category) {
                  setValue(`items.${index}.category_uuid`, option.financial_category, {
                    shouldValidate: true,
                  });
                }
                // DEFEITO F-084 — trocar o Produto invalida a Un. Medida
                // escolhida (pertencia ao produto anterior). Dedupe por
                // `uuid` (mirror EXATO `InvoiceItemsTab.tsx`
                // TASK-FE-705/DF-30): quando o produto tem as 2 unidades
                // IGUAIS ou só tem 1 cadastrada, resta exatamente 1 opção
                // após dedupe — auto-seleciona; com 2 opções distintas ou
                // nenhum produto, fica vazio para escolha manual.
                const dedupedMeasurements = Array.from(
                  new Map(
                    [option?.measurement, option?.measurementSecond]
                      .filter(
                        (
                          candidate: Option<string> | null | undefined
                        ): candidate is Option<string> => Boolean(candidate)
                      )
                      .map((candidate: Option<string>) => [candidate.value, candidate])
                  ).values()
                );
                setValue(
                  `items.${index}.measurement_uuid`,
                  dedupedMeasurements.length === 1 ? (dedupedMeasurements[0] as any) : null,
                  { shouldValidate: true }
                );
              }}
              isRequired
              // DD-078-07 (b): produto de item já gravado é somente leitura.
              isDisabled={isDisabled || lotLocked}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`items.${index}.measurement_uuid`}
          control={control}
          render={({ field }) => {
            // DEFEITO F-084 (correção pós-entrega) — deixou de ser catálogo
            // genérico (`listMeasurementOptions`, listava TODAS as unidades
            // do sistema) — agora restrito às 1-2 unidades DO PRODUTO
            // selecionado nesta linha (primária sempre, secundária
            // condicional), embutidas na própria option de Produto (ver
            // Controller acima). Gateado até o Produto ser escolhido; Select
            // LOCAL (não `SelectAsyncPaginate` — o catálogo já está
            // resolvido em memória, sem endpoint novo). Mirror EXATO
            // `InvoiceItemsTab.tsx` TASK-FE-669/DF-26 (GAP-BE-641).
            // T-078-FE-04 — une a unidade JÁ SALVA (valor atual do campo) às do
            // produto: em edição ela pode não pertencer mais ao produto, e o
            // Select (collection) só exibe valores presentes na lista.
            const measurementOptions = buildMeasurementOptions(
              [productOption?.measurement, productOption?.measurementSecond],
              field.value as Option<string> | null | undefined
            );

            return (
              <Select
                name={field.name}
                label={formText.fields.measurement}
                placeholder={formText.placeholders.measurement}
                value={field.value ?? null}
                onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                options={measurementOptions}
                error={rowErrors?.measurement_uuid?.message as string | undefined}
                isRequired
                isDisabled={isDisabled || !productOption || measurementOptions.length <= 1}
              />
            );
          }}
        />

        <Controller
          name={`items.${index}.quantity`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.quantity}
              allowDot
              decimalPlaces={3}
              value={field.value ?? null}
              onValueChange={(value) => {
                lastEditedFieldRef.current = 'quantity_or_unit';
                field.onChange(value);
              }}
              error={rowErrors?.quantity?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.unit_value`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.unitValue}
              allowDot
              decimalPlaces={4}
              value={field.value ?? null}
              onValueChange={(value) => {
                lastEditedFieldRef.current = 'quantity_or_unit';
                field.onChange(value);
              }}
              error={rowErrors?.unit_value?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        {/* CORRECAO-R1/E4 — EDITÁVEL (deixou de ser `disabled` fixo);
            recálculo INVERSO ajusta `unit_value` quando `quantity > 0`. */}
        <Controller
          name={`items.${index}.total_value`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.totalValue}
              allowDot
              decimalPlaces={2}
              value={field.value ?? null}
              onValueChange={handleTotalValueChange}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.generate_stock`}
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={formText.fields.generateStock}
              name={name}
              value={
                [
                  { value: true, label: languageGB.defaltStrings.yes },
                  { value: false, label: languageGB.defaltStrings.no },
                ].find((option) => option.value === !!value) ?? null
              }
              onChange={(option: { value: boolean; label: string } | null) => {
                onChange(!!option?.value);
                if (!option?.value) {
                  setValue(`items.${index}.warehouse_uuid`, null);
                } else {
                  // CORRECAO-R1/E5 — inverso do Armazém: ao ligar "Gera
                  // Estoque?", a apropriação fica readonly e LIMPA
                  // (`clear_appropriation`, contrato FM-018/IG-005).
                  setValue(`items.${index}.appropriation_type`, null);
                }
              }}
              options={[
                { value: true, label: languageGB.defaltStrings.yes },
                { value: false, label: languageGB.defaltStrings.no },
              ]}
              noClearable
              isDisabled={isDisabled}
            />
          )}
        />

        {generateStock && (
          <Controller
            name={`items.${index}.warehouse_uuid`}
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.warehouse}
                placeholder={formText.placeholders.warehouse}
                error={rowErrors?.warehouse_uuid?.message as string | undefined}
                service={listWarehouseOptions}
                pageSize={200}
                mapOptions={(item: WarehouseOption) => ({
                  label: `${item.initials} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired={!!generateStock}
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        )}

        {/* CORRECAO-R1/E5 — Select (Agricultura "1" / Pecuária "2"),
            constante LOCAL do Entrada/Insumos (NÃO reutiliza a do Invoice)
            só para os RÓTULOS (i18n 3 idiomas — o backend devolve labels
            fixos em PT-BR). Editável só quando `generate_stock=false`;
            readonly (e já limpo pelo `onChange` de "Gera Estoque?" acima)
            quando `true`.
            F-084 item 3 (TASK-BE-1085/GAP-BE-684) — a ORIGEM das opções
            agora É filtrada pelos Centros de Custo habilitados do tenant
            (`GET /input-entries/appropriation-types/options`, mirror
            `ListAppropriationTypeOptionsAction`/GAP-BE-622 de Invoice,
            lookup ÚNICO por aba em `eligibleAppropriationTypeValues`, prop
            vinda de `EntradaInsumosItemsTab`). `value` do endpoint é
            SEMPRE string — combinado por `.includes()`, nunca `===`
            numérico. Enquanto a elegibilidade ainda carrega (`undefined`),
            nenhuma opção é oferecida (evita expor um valor não elegível por
            1 render, mesmo racional de `InvoiceItemsTab.tsx`). */}
        <Controller
          name={`items.${index}.appropriation_type`}
          control={control}
          render={({ field }) => (
            <Select
              label={formText.fields.appropriationType}
              placeholder={formText.placeholders.appropriationType}
              name={field.name}
              value={field.value ?? null}
              onChange={(option: { value: string; label: string } | null) =>
                field.onChange(option ?? null)
              }
              options={inputEntryAppropriationTypeOptions
                .options(languageGB)
                .filter((option) => eligibleAppropriationTypeValues?.includes(option.value))}
              error={rowErrors?.appropriation_type?.message as string | undefined}
              isDisabled={isDisabled || !!generateStock}
            />
          )}
        />

        {/* F-084 item 1 — ESCONDIDOS (não só desabilitados) quando o produto
            selecionado tem `has_lot=false`; visíveis, editáveis e
            `required` quando `has_lot=true` (contrato FM-019/FM-020,
            cascata `product_change` no `onChange` de Produto acima).
            `hasLot` é recomputado tanto na seleção quanto na HIDRATAÇÃO de
            edição (`has_lot` embutido em `product_uuid` por
            `fillEntradaInsumosForm`, `CreateOrUpdateEntradaInsumos.tsx`) —
            NÃO replica o defeito do legado, que travava os campos sempre
            visíveis/bloqueados na edição por não recalcular. Ocultos, não
            entram no fluxo de validação (schema só exige quando
            `has_lot=true`) e o valor já é limpo pela cascata acima. */}
        {showProviderLot && (
          <Controller
            name={`items.${index}.provider_lot`}
            control={control}
            render={({ field }) => (
              <Input
                label={formText.fields.providerLot}
                name={field.name}
                maxLength={15}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                error={rowErrors?.provider_lot?.message as string | undefined}
                isRequired={!lotLocked}
                disabled={isDisabled || lotLocked}
              />
            )}
          />
        )}

        {showShelfLife && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {formText.fields.shelfLife}
            </Text>
            <Controller
              name={`items.${index}.shelf_life`}
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  value={value ?? null}
                  onChange={onChange}
                  disabled={isDisabled || lotLocked}
                />
              )}
            />
          </Box>
        )}

        <Controller
          name={`items.${index}.cultivation_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.cultivation}
              placeholder={formText.placeholders.cultivation}
              service={listCultivationOptions}
              mapOptions={(item: { uuid: string; label: string }) => ({
                label: item.label,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        {/* F-084 item 2 (TASK-BE-1084/GAP-BE-683) — auto-preenchimento com a
            Categoria Financeira DEFAULT do produto IMPLEMENTADO (ver
            `financial_category` embutido no `mapOptions`/`onChange` do
            Controller de Produto acima) — `GET /products` (listagem) agora
            eager-load `financialCategory`. Sem categoria default no
            produto, o campo permanece como está (não preenche, não limpa).
            F-084 item 5 — obrigatório na UI, `isRequired` + validação em
            `input-entry-schema.ts` (fidelidade ao legado).
            TASK-BE-1086 v3 (GAP-BE-685, Opção C) — `cost_center_scoped=true`
            + `type_id=1` ("Saídas") + `is_enabled=true`: mirror do filtro do
            legado (só categorias com vínculo de Centro de Custo habilitado
            do tenant, ou sem vínculo nenhum), EXCLUSIVO desta tela — nenhum
            outro consumidor de `listFinancialCategoryOptions` envia este
            param (ver cabeçalho do service). */}
        <Controller
          name={`items.${index}.category_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.category}
              placeholder={formText.placeholders.category}
              error={rowErrors?.category_uuid?.message as string | undefined}
              service={listFinancialCategoryOptions}
              mapOptions={(item: FinancialCategoryOption) => ({
                label: item.description,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                type_id: 1,
                is_enabled: 'true',
                cost_center_scoped: 'true',
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              isRequired
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        {/* F-084 item 5 — `isRequired` (antes ausente); validação obrigatória
            correspondente em `input-entry-schema.ts` (`center_uuid`). */}
        <Controller
          name={`items.${index}.center_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.center}
              placeholder={formText.placeholders.center}
              service={listCostCenterOptions}
              mapOptions={(item: CostCenterRef) => ({
                label: `${item.code} — ${item.description}`,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                only_analytic: true,
              })}
              error={rowErrors?.center_uuid?.message as string | undefined}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              isRequired
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />
      </SimpleGrid>

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          aria-label={formText.itemRow.removeButton}
          mensegerTooltip={formText.itemRow.removeButton}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={isDisabled}
          onClick={onRemove}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Box>
  );
}
