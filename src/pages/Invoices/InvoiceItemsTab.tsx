// src/pages/Invoices/InvoiceItemsTab.tsx
// -----------------------------------------------------------------------------
// Aba "Itens & Totais" do formulário de Invoice — TASK-FE-2764. Tabela
// dinâmica de itens (`useFieldArray`, mirror
// `EquipamentoRateioCentroCustoTab.tsx`, muito mais colunas por linha) + bloco
// "Totais" calculado no client (PREVIEW — o servidor sempre recalcula,
// mirror `CreateOrUpdateEstoqueInicial.tsx`).
//
// "Classificação" de item (spec-visual) — implementado como `cultivation_uuid`
// (hipótese documentada pelo Arquiteto: mesmo conceito de "Cultura/Variedade"
// já usado em `Apontamentos`; o contrato real NÃO tem campo `classification`
// por item). Bloco "Café" (10+ campos condicionais) FORA de escopo (D6).
//
// `has_lot` do produto selecionado é lido DIRETO do item da própria opção do
// `SelectAsyncPaginate` (`ProductListItem.has_lot`, já presente na listagem
// paginada de Produtos — SEM query extra) e guardado em
// `items.${index}.has_lot` NO PRÓPRIO FORM (campo client-only, mirror
// `generates_stock`, NUNCA enviado no payload) — TASK-FE-627 (DF-09,
// execução 035) corrigiu isto de um `useState(false)` local (que nunca era
// semeado a partir do item carregado em modo edição) para `watch()`/
// `setValue()` do form, seedado por `reset()` em `fillInvoiceForm`
// (`CreateOrUpdateInvoice.tsx`), igual a `ItemInvoiceDetail.has_lot` da API.
//
// `appropriation_type` — Área/Atividade/Operação (cascata Agrícola) só
// aparecem quando o ramo selecionado é `AGRICOLA(1)` (único funcional,
// GAP-528); os demais ramos (Pastagem/Manutenção de Equipamento/
// Abastecimento) ficam disponíveis no Select (rotulados "indisponível nesta
// versão") mas sem sub-campos — o 422 do backend nesse caso é tratado no
// `onError` de `CreateOrUpdateInvoice.tsx` (mensagem real, sem quebrar a UI).
//
// Cascata `equipment{}` (obrigatória quando `is_equipment===true`, achado
// real não documentado no packet original) — bloco inline "Dados do
// equipamento" por linha, mirror dos campos de `CreateOrUpdateEquipamento.tsx`
// (Família/Descrição/Tempo Produtivo/Valor Aquisição/Status).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';

import { Box, Flex, Icon, IconButton, SimpleGrid, Text, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiChevronDown, FiChevronUp, FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { SelectCultivation } from '@/components/Form/SelectCultivation';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';
import {
  appropriationTypeIndex,
  appropriationTypeOptions,
} from '@/constants/invoices/options/appropriation-type-options';

import { listActivities } from '@/services/v2/Activities/activity-service';
import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { listAppropriationTypeOptions } from '@/services/v2/Invoices/invoice-service';
import { listOperations } from '@/services/v2/Operations/operation-service';
import { listProducts } from '@/services/v2/Products/product-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { ActivityListItem } from '@/@types/v2/Activities';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { AppropriationTypeValue, InvoiceForm, InvoiceItemForm } from '@/@types/v2/Invoices';
import type { OperationListItem } from '@/@types/v2/Operations';
import type { ProductListItem } from '@/@types/v2/Products';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { CreateProductFromXmlModal } from './CreateProductFromXmlModal';
import { InvoiceItemEquipmentPanel } from './InvoiceItemEquipmentPanel';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface InvoiceItemsTabProps {
  control: Control<InvoiceForm>;
  errors: FieldErrors<InvoiceForm>;
  watch: UseFormWatch<InvoiceForm>;
  setValue: UseFormSetValue<InvoiceForm>;
  isLoading: boolean;
  canSave: boolean;
}

const EQUIPMENT_STATUS_ACTIVE = 1;
const EQUIPMENT_STATUS_INACTIVE = 2;

/**
 * Soma dos itens (`quantity × amount`, SEM desconto) — MESMA fórmula usada
 * por `invoice-schema.ts` (soma cruzada das parcelas) e pelo `total_amount`
 * editável de cada linha (TASK-FE-624/DF-04). Duplicada de propósito (schema
 * é fronteira de outra Tarefa, mirror do racional já documentado em
 * `EquipamentoRateioCentroCustoTab.tsx` para `COST_CENTER_SUM_TOLERANCE`) —
 * nunca uma 2ª fórmula divergente.
 *
 * ⚠️ TASK-FE-624 (DF-04, execução 035): o desconto por item NÃO entra mais
 * nesta soma — o Arquiteto API confirmou que o contrato (`Invoice-contrato.
 * md` §9 regra 1) e o backend real calculam `total_amount = quantity ×
 * amount`, sem subtrair `discount`; o cálculo anterior (`− discount`) estava
 * divergente do servidor desde antes desta correção.
 * @param {InvoiceItemForm[]} items - Itens do form (`watch('items')`).
 * @return {number} `vl_items` calculado no client (preview).
 */
function computeVlItems(items: InvoiceItemForm[]): number {
  return items.reduce((total, item) => {
    const quantity = Number(item?.quantity) || 0;
    const amount = Number(item?.amount) || 0;
    return total + quantity * amount;
  }, 0);
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function InvoiceItemsTab({
  control,
  errors,
  watch,
  setValue,
  isLoading,
  canSave,
}: InvoiceItemsTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.invoices.invoice.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const isDisabled = !canSave || isLoading;

  // TASK-FE-626/DF-06 (GAP-BE-622, sub-opção b) — elegibilidade de "Tipo
  // Apropriação" por Centro de Custo do TENANT (não por linha) — 1 lookup
  // para a aba inteira, reusado por todas as linhas via prop. Combinado com
  // o filtro de GAP-528 (funcionalidade) já existente em
  // `appropriation-type-options.ts` (as 2 regras coexistem — elegível E
  // funcional). `NENHUM(0)` nunca vem do endpoint (sentinela client-only) —
  // combinado explicitamente na leitura abaixo.
  const appropriationTypeEligibilityQuery = useQuery({
    queryKey: ['invoice-appropriation-type-eligibility'],
    queryFn: async () => {
      const response = await listAppropriationTypeOptions();
      return response.data.map((option) => option.value);
    },
    staleTime: 5 * 60 * 1000,
  });

  const watchedItems = watch('items') ?? [];
  const vlItems = computeVlItems(watchedItems);
  const vlFreight = Number(watch('vl_freight')) || 0;
  const vlSafe = Number(watch('vl_safe')) || 0;
  const vlExpense = Number(watch('vl_expense')) || 0;
  const vlIpi = Number(watch('vl_ipi')) || 0;
  const vlDiscount = Number(watch('vl_discount')) || 0;
  const vlTotal = vlItems + vlFreight + vlIpi - vlDiscount + vlSafe + vlExpense;

  const arrayError = errors.items?.message as string | undefined;

  const equipmentStatusOptions: Option<number>[] = [
    { value: EQUIPMENT_STATUS_ACTIVE, label: formText.fields.equipmentStatusActive },
    { value: EQUIPMENT_STATUS_INACTIVE, label: formText.fields.equipmentStatusInactive },
  ];

  function handleAdd() {
    append({
      product_uuid: null,
      quantity: null,
      amount: null,
      total_amount: null,
      has_lot: false,
      warehouse_uuid: null,
      center_uuid: null,
      category_uuid: null,
      cultivation_uuid: null,
      measurement_uuid: null,
      generates_stock: false,
      is_equipment: false,
      provider_lot: null,
      shelf_life: null,
      ipi: null,
      icms: null,
      discount: 0,
      appropriation_type: null,
      equipment: null,
      xml_description: null,
      xml_ncm: null,
      xml_um: null,
      aprop_cultivation_uuid: null,
      aprop_area_uuid: null,
      aprop_operation_uuid: null,
      aprop_activity_uuid: null,
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
            <InvoiceItemRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isDisabled={isDisabled}
              equipmentStatusOptions={equipmentStatusOptions}
              eligibleAppropriationTypeValues={appropriationTypeEligibilityQuery.data}
              onRemove={() => remove(index)}
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

      {/* ---- Bloco "Totais" ---- */}
      <Box mt={8} pt={4} borderTop="1px solid" borderColor="border.subtle">
        <Text fontSize="sm" fontWeight="semibold" mb={4}>
          {formText.sections.totals}
        </Text>

        <SimpleGrid columns={columnsForm.default} gap={6}>
          <InputReadOnly label={formText.totalsFields.vlItems} value={formatCurrencyBRL(vlItems)} />

          <Controller
            name="vl_ipi"
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={formText.totalsFields.vlIpi}
                allowDot
                decimalPlaces={2}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                disabled={isDisabled}
              />
            )}
          />

          <Controller
            name="vl_discount"
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={formText.totalsFields.vlDiscount}
                allowDot
                decimalPlaces={2}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                disabled={isDisabled}
              />
            )}
          />

          <Controller
            name="vl_freight"
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={formText.totalsFields.vlFreight}
                allowDot
                decimalPlaces={2}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                disabled={isDisabled}
              />
            )}
          />

          <Controller
            name="vl_safe"
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={formText.totalsFields.vlSafe}
                allowDot
                decimalPlaces={2}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                disabled={isDisabled}
              />
            )}
          />

          <Controller
            name="vl_expense"
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={formText.totalsFields.vlExpense}
                allowDot
                decimalPlaces={2}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                disabled={isDisabled}
              />
            )}
          />

          <Controller
            name="conveyor"
            control={control}
            render={({ field }) => (
              <Input
                label={formText.totalsFields.conveyor}
                name={field.name}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                disabled={isDisabled}
              />
            )}
          />

          <Box
            key={`vl-total-${vlTotal}`}
            css={{
              animation: 'invoiceTotalFlash 0.3s ease',
              '@keyframes invoiceTotalFlash': {
                '0%': { backgroundColor: 'var(--chakra-colors-green-100)' },
                '100%': { backgroundColor: 'transparent' },
              },
            }}
            borderRadius="md"
          >
            <InputReadOnly
              label={formText.totalsFields.vlTotal}
              value={formatCurrencyBRL(vlTotal)}
            />
          </Box>
        </SimpleGrid>
      </Box>
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Linha de item — componente próprio (1 componente por linha, mirror
// "hook por linha = componente por linha") para permitir `hasLot`
// local-por-linha sem violar Rules of Hooks.
// -----------------------------------------------------------------------------

interface InvoiceItemRowProps {
  index: number;
  control: Control<InvoiceForm>;
  errors: FieldErrors<InvoiceForm>;
  watch: UseFormWatch<InvoiceForm>;
  setValue: UseFormSetValue<InvoiceForm>;
  isDisabled: boolean;
  equipmentStatusOptions: Option<number>[];
  // TASK-FE-626/DF-06 — elegibilidade por Centro de Custo do tenant
  // (`undefined` = ainda carregando; `NENHUM(0)` nunca vem aqui, tratado
  // como sempre elegível na combinação abaixo).
  eligibleAppropriationTypeValues: AppropriationTypeValue[] | undefined;
  onRemove: () => void;
}

function InvoiceItemRow({
  index,
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  equipmentStatusOptions,
  eligibleAppropriationTypeValues,
  onRemove,
}: InvoiceItemRowProps) {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const formText = languageGB.invoices.invoice.form;

  // TASK-FE-627 (DF-09) — `hasLot` vive no FORM (`items.${index}.has_lot`,
  // seedado por `reset()` em `fillInvoiceForm`/`CreateOrUpdateInvoice.tsx`),
  // NÃO em `useState` local — a causa raiz do achado de E2E era exatamente
  // o `useState(false)` anterior nunca ser semeado a partir do item
  // carregado em modo edição (mecânica condicional abaixo já estava
  // correta, só a fonte do sinal estava errada). Mirror de `generatesStock`
  // (linha abaixo), mesmo padrão "watch direto do form".
  const hasLot = !!watch(`items.${index}.has_lot`);

  // TASK-FE-624 (DF-04) — flag para não "flashar" a animação de recálculo
  // quando o PRÓPRIO usuário edita "V. Total(R$)" diretamente (só quando o
  // total muda por REAÇÃO a quantidade/valor unitário).
  const skipNextTotalFlash = useRef(false);
  const isFirstRender = useRef(true);
  const [totalFlashKey, setTotalFlashKey] = useState(0);

  // `listAreas` exige `farm_uuid` (`AreaIndexRequest::rules()`, tenant-wide
  // sem esse filtro) — o `SelectAsyncPaginate` só conhece
  // `PaginationQueryParams` genérico, então a fazenda ativa é injetada aqui
  // via closure (mirror do padrão documentado no cabeçalho de
  // `areas-service.ts`, opção 1: `SelectAsyncPaginate` + `findParams`).
  function listAreasForActiveFarm(params: { search?: string; page?: number; per_page?: number }) {
    return listAreas({ ...params, farm_uuid: activeFarmUuid ?? '' });
  }

  const rowErrors = errors.items?.[index];
  const generatesStock = watch(`items.${index}.generates_stock`);
  const isEquipment = watch(`items.${index}.is_equipment`);
  const appropriationType = watch(`items.${index}.appropriation_type`);
  const quantity = Number(watch(`items.${index}.quantity`)) || 0;
  const amount = Number(watch(`items.${index}.amount`)) || 0;

  // GAP-BE-630/DF-13 (TASK-FE-653) — item de XML sem Produto casado
  // (`product_matched===false` no draft, `handleXmlImported`/
  // `CreateOrUpdateInvoice.tsx`). Mostra a descrição crua do XML + botão
  // "+" que abre o cadastro de Produto (nova aba, NÃO auto-cria) com
  // descrição/NCM como hint. Some sozinho quando o usuário escolhe um
  // Produto no Select (o hint deixa de fazer sentido).
  const xmlDescriptionHint = watch(`items.${index}.xml_description`);
  const xmlNcmHint = watch(`items.${index}.xml_ncm`);
  const xmlUmHint = watch(`items.${index}.xml_um`);
  const productUuidValue = watch(`items.${index}.product_uuid`);
  const showXmlUnmatchedHint = !!xmlDescriptionHint && !productUuidValue;

  // TASK-FE-668 (DF-25, rework, execução 034) — deixou de abrir o cadastro
  // completo de Produto em NOVA ABA (`window.open`) e passa a abrir um Modal
  // DENTRO da própria tela, pré-preenchido a partir do XML; ao salvar, o
  // Produto criado volta selecionado neste MESMO item, sem navegação.
  // `useDisclosure` POR LINHA — mirror do próprio padrão "hook por linha =
  // componente por linha" já documentado no cabeçalho do arquivo
  // (`equipmentModalDisclosure`, mesma técnica).
  const createProductFromXmlModalDisclosure = useDisclosure();

  function handleProductCreatedFromXml(created: {
    uuid: string;
    description: string;
    has_lot: boolean;
    // TASK-FE-780 — Un. Medida(s) do Produto recém-criado, mesmas chaves
    // que `measurementOptions` (linhas ~664–669 abaixo) lê da option de
    // Produto (GAP-BE-641/TASK-FE-669). Sem isso, o Select "Un. Medida" da
    // linha fica sem opções para um Produto criado por este modal, mesmo
    // com `measurement_uuid` do form já preenchido (causa-raiz TASK-FE-780).
    measurement: Option<string> | null;
    measurementSecond: Option<string> | null;
  }) {
    setValue(`items.${index}.product_uuid`, {
      label: created.description,
      value: created.uuid,
      measurement: created.measurement,
      measurementSecond: created.measurementSecond,
      // TASK-FE-780 — `product_uuid` do form é tipado como `Option<string> |
      // null` (`InvoiceForm`), mas já convive com campos extras embutidos
      // pelo `mapOptions` de Produto (linhas ~543–564, `has_lot`/
      // `measurement`/`measurementSecond`) e lidos de volta via cast na
      // leitura (`productOption`, linhas ~651–657). Cast aqui só espelha o
      // mesmo contrato implícito na escrita, sem widening do tipo do form.
    } as Option<string>);
    setValue(`items.${index}.has_lot`, !!created.has_lot);

    // TASK-FE-780 — reconciliar `measurement_uuid` com a MESMA lógica de
    // dedupe do `onChange` de Produto (linhas ~580–590, TASK-FE-705/DF-30):
    // nunca deixar sobreviver a sugestão genérica anterior do XML
    // (`suggestMeasurementOption`, catálogo completo) — ela pode não ser
    // uma unidade válida do Produto recém-criado. Auto-seleciona quando
    // resta 1 opção deduplicada; senão `null` para escolha manual.
    const dedupedMeasurements = Array.from(
      new Map(
        [created.measurement, created.measurementSecond]
          .filter((candidate): candidate is Option<string> => Boolean(candidate))
          .map((candidate) => [candidate.value, candidate])
      ).values()
    );
    setValue(
      `items.${index}.measurement_uuid`,
      dedupedMeasurements.length === 1 ? dedupedMeasurements[0] : null
    );

    createProductFromXmlModalDisclosure.onClose();
  }

  const isAgriculture = appropriationType?.value === appropriationTypeIndex.AGRICOLA;

  // TASK-FE-624 (DF-04) — auto-recálculo reativo de "V. Total(R$)"
  // (`quantity × amount`, SEM desconto — contrato §9 regra 1, confirmado
  // 100% FE pelo Arquiteto API na execução 035) sempre que quantidade/valor
  // unitário mudam. Pula o 1º render (evita sobrescrever o valor
  // reidratado em edição e evita flash indevido no mount).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setValue(`items.${index}.total_amount`, quantity * amount, { shouldValidate: false });
    if (!skipNextTotalFlash.current) {
      setTotalFlashKey((key) => key + 1);
    }
    skipNextTotalFlash.current = false;
  }, [quantity, amount]);

  // TASK-FE-626/DF-06 (GAP-BE-622, sub-opção b) — combina a elegibilidade
  // por Centro de Custo do tenant (`eligibleAppropriationTypeValues`, prop
  // vinda do lookup ÚNICO da aba) com o filtro de GAP-528 (funcionalidade)
  // já embutido em `appropriationTypeOptions.options()` (rotula
  // "(indisponível nesta versão)" quem não é processado de fato, sub-opção
  // (b): SEM esconder por isso). `NENHUM(0)` é sempre elegível (sentinela
  // client-only, nunca devolvido pelo endpoint). Enquanto a elegibilidade
  // ainda carrega (`undefined`), só `NENHUM` fica disponível — evita
  // oferecer "Agrícola" a uma fazenda que a re-E2E confirmou não elegível,
  // mesmo que por 1 render.
  const appropriationOptions = useMemo(() => {
    const allOptions = appropriationTypeOptions.options(languageGB);
    return allOptions.filter(
      (option) =>
        option.value === appropriationTypeIndex.NENHUM ||
        (eligibleAppropriationTypeValues?.includes(option.value) ?? false)
    );
  }, [languageGB, eligibleAppropriationTypeValues]);

  // TASK-FE-629/630/631 (DF-10, execução 035) — o bloco inline "Dados do
  // equipamento" (5 campos) virou um bloco de ~24 campos em 3 abas
  // (`InvoiceItemEquipmentPanel.tsx`). TASK-FE-648 (DF-18, REWORK) —
  // deixou de ser um Modal Form (Dialog v3) e virou um painel INLINE
  // colapsável dentro do próprio card do item; o MESMO `useDisclosure` POR
  // LINHA (mirror do próprio padrão "hook por linha = componente por linha"
  // já documentado no cabeçalho do arquivo para `hasLot`) agora controla
  // expandir/ocultar (`.open`/`.onToggle`) em vez de abrir/fechar o Dialog.
  const equipmentModalDisclosure = useDisclosure();

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      {/* ---- Produto & Quantidade (TASK-FE-646/DF-11 — sectioning, mirror
          AppropriationProductionTab.tsx) ---- */}
      <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" mb={2}>
        {formText.sections.itemProductAndQuantity}
      </Text>
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Box>
          <Controller
            name={`items.${index}.product_uuid`}
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.product}
                placeholder={formText.placeholders.product}
                error={rowErrors?.product_uuid?.message as string | undefined}
                service={listProducts}
                mapOptions={(item: ProductListItem) => ({
                  label: item.code ? `${item.code} — ${item.description}` : item.description,
                  value: item.uuid,
                  has_lot: item.has_lot,
                  // TASK-FE-669/DF-26 (GAP-BE-641) — embute as 1-2
                  // unidades válidas DO PRODUTO na própria option
                  // (`GET /products` já eager-load `measurement`/
                  // `measurementSecond` via o MESMO `ProductResource`
                  // do detalhe — sem trocar de fonte/endpoint, mirror
                  // `AppropriationProductionTab.tsx`/AP-18). O Select de
                  // "Un. Medida" abaixo lê estes 2 campos da option
                  // corrente, sem round-trip extra.
                  measurement: item.measurement
                    ? { label: item.measurement.description, value: item.measurement.uuid }
                    : null,
                  measurementSecond: item.measurement_second
                    ? {
                        label: item.measurement_second.description,
                        value: item.measurement_second.uuid,
                      }
                    : null,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  setValue(`items.${index}.has_lot`, !!option?.has_lot);
                  // TASK-FE-669/DF-26 — trocar o Produto invalida a Un.
                  // Medida escolhida (pertencia ao produto anterior).
                  // TASK-FE-705/DF-30 — dedupe por uuid (mirror EXATO
                  // `AppropriationProductionTab.tsx:529-546`, AP-27):
                  // quando o produto tem as 2 unidades IGUAIS ou só tem 1
                  // cadastrada, resta exatamente 1 opção após dedupe —
                  // auto-seleciona; com 2 opções distintas, fica vazio
                  // para escolha manual.
                  const dedupedMeasurements = Array.from(
                    new Map(
                      [option?.measurement, option?.measurementSecond]
                        .filter((candidate): candidate is Option<string> => Boolean(candidate))
                        .map((candidate) => [candidate.value, candidate])
                    ).values()
                  );
                  setValue(
                    `items.${index}.measurement_uuid`,
                    dedupedMeasurements.length === 1 ? dedupedMeasurements[0] : null
                  );
                }}
                isRequired
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                // GAP-BE-630/DF-13 (TASK-FE-653) — botão criar Produto a
                // partir do XML migrado do `IconButtonTable` avulso ao lado
                // do select para o `labelAction` (EST-07). Só aparece
                // quando o item veio de um upload de XML cujo Produto NÃO
                // casou (`product_matched===false`) e o usuário ainda não
                // escolheu um Produto manualmente — mesma condição
                // `showXmlUnmatchedHint`, `undefined` quando não se aplica
                // (Field renderiza o label exatamente como antes).
                labelActionTooltip={
                  showXmlUnmatchedHint ? formText.itemRow.createProductFromXmlButton : undefined
                }
                labelAction={
                  showXmlUnmatchedHint ? (
                    <IconButton
                      aria-label={formText.itemRow.createProductFromXmlButton}
                      variant="ghost"
                      size="2xs"
                      minH="0"
                      h="20px"
                      w="20px"
                      minW="0"
                      p="0"
                      disabled={isDisabled}
                      onClick={createProductFromXmlModalDisclosure.onOpen}
                    >
                      <Icon as={FiPlus} boxSize="16px" color="primaryMain" />
                    </IconButton>
                  ) : undefined
                }
              />
            )}
          />

          {showXmlUnmatchedHint && (
            <Text fontSize="xs" color="fg.muted" mt={1}>
              {formText.itemRow.xmlUnmatchedHintPrefix}: {xmlDescriptionHint}
            </Text>
          )}

          {showXmlUnmatchedHint && (
            <CreateProductFromXmlModal
              isOpen={createProductFromXmlModalDisclosure.open}
              onClose={createProductFromXmlModalDisclosure.onClose}
              descriptionHint={xmlDescriptionHint ?? ''}
              ncmHint={xmlNcmHint ?? null}
              measurementUmHint={xmlUmHint ?? null}
              referencePriceHint={Number(watch(`items.${index}.amount`)) || 0}
              onCreated={handleProductCreatedFromXml}
            />
          )}
        </Box>

        <Controller
          name={`items.${index}.measurement_uuid`}
          control={control}
          render={({ field }) => {
            // TASK-FE-669/DF-26 (GAP-BE-641) — deixou de ser catálogo
            // genérico (`listMeasurementOptions`) — agora restrito às 1-2
            // unidades DO PRODUTO selecionado nesta linha (primária sempre,
            // secundária condicional), embutidas na própria option de
            // Produto (ver Controller acima). Gateado até o Produto ser
            // escolhido; Select LOCAL (não `SelectAsyncPaginate` — o
            // catálogo já está resolvido em memória, sem endpoint novo).
            const productOption = productUuidValue as
              | (Option<string> & {
                  measurement?: Option<string> | null;
                  measurementSecond?: Option<string> | null;
                })
              | null
              | undefined;
            // TASK-FE-705/DF-30 — dedupe por `uuid` (Lei 10 — chave real,
            // mais robusto que dedupe por `label`): quando `measurement` e
            // `measurementSecond` são a MESMA unidade, o Select nunca mostra
            // a opção duplicada (mirror EXATO
            // `AppropriationProductionTab.tsx:573-600`, AP-27).
            const measurementOptions = Array.from(
              new Map(
                [productOption?.measurement, productOption?.measurementSecond]
                  .filter((option): option is Option<string> => Boolean(option))
                  .map((option) => [option.value, option])
              ).values()
            );

            return (
              <Select
                name={field.name}
                label={formText.fields.measurement}
                value={field.value ?? null}
                onChange={(option) => field.onChange(option ?? null)}
                options={measurementOptions}
                isDisabled={isDisabled || !productUuidValue || measurementOptions.length <= 1}
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
              onValueChange={(value) => field.onChange(value)}
              error={rowErrors?.quantity?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.amount`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.amount}
              allowDot
              decimalPlaces={4}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={rowErrors?.amount?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.discount`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.discount}
              allowDot
              decimalPlaces={2}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              disabled={isDisabled}
            />
          )}
        />

        {/* TASK-FE-624 (DF-04) — editável com recálculo bidirecional (mirror
            legado `_card-item.blade.php:86-95,396-448`): quantidade/valor
            unitário → recalcula total; total editado direto → back-deriva
            valor unitário (`amount = total_amount / quantity`). Preview
            client-side; NUNCA enviado no payload (servidor sempre
            recalcula `quantity × amount`, ignora este campo). */}
        <Box
          key={`item-${index}-total-flash-${totalFlashKey}`}
          css={{
            animation: 'invoiceTotalFlash 0.3s ease',
            '@keyframes invoiceTotalFlash': {
              '0%': { backgroundColor: 'var(--chakra-colors-green-100)' },
              '100%': { backgroundColor: 'transparent' },
            },
          }}
          borderRadius="md"
        >
          <Controller
            name={`items.${index}.total_amount`}
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={formText.fields.totalAmount}
                allowDot
                decimalPlaces={2}
                value={field.value ?? null}
                onValueChange={(value) => {
                  field.onChange(value);
                  if (quantity > 0) {
                    skipNextTotalFlash.current = true;
                    setValue(`items.${index}.amount`, Number(value ?? 0) / quantity, {
                      shouldValidate: true,
                    });
                  }
                }}
                disabled={isDisabled}
              />
            )}
          />
        </Box>
      </SimpleGrid>

      {/* ---- Estoque & Apropriação (TASK-FE-646/DF-11) ---- */}
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        mt={4}
        mb={2}
      >
        {formText.sections.itemStockAndAppropriation}
      </Text>
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`items.${index}.generates_stock`}
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={formText.fields.generatesStock}
              name={name}
              value={
                [
                  { value: true, label: languageGB.defaltStrings.yes },
                  { value: false, label: languageGB.defaltStrings.no },
                ].find((option) => option.value === !!value) ?? null
              }
              onChange={(option: Option<boolean> | null) => {
                onChange(!!option?.value);
                if (!option?.value) {
                  setValue(`items.${index}.warehouse_uuid`, null);
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

        {generatesStock && (
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
                isRequired={!!generatesStock}
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        )}

        {/* TASK-FE-621 (DF-08) — "Tipo Apropriação" reordenado para
            IMEDIATAMENTE após "Armazém" (antes era depois de Categoria
            Financeira/Centro de Custo/Classificação, 3 campos de
            distância). Mesmo `Controller`/`name`, sem mudança de
            comportamento — cascata Agrícola continua reagindo ao MESMO
            campo `appropriation_type`. */}
        <Controller
          name={`items.${index}.appropriation_type`}
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={formText.fields.appropriationType}
              placeholder={formText.placeholders.appropriationType}
              name={name}
              value={appropriationOptions.find((option) => option.value === value?.value) ?? null}
              onChange={(option) => onChange(option ?? null)}
              options={appropriationOptions}
              isDisabled={isDisabled || !!generatesStock}
            />
          )}
        />
      </SimpleGrid>

      {/* ---- Fiscal & Classificação (TASK-FE-646/DF-11) ---- */}
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        mt={4}
        mb={2}
      >
        {formText.sections.itemFiscalAndClassification}
      </Text>
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`items.${index}.category_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.financialCategory}
              placeholder={formText.placeholders.financialCategory}
              service={listFinancialCategoryOptions}
              mapOptions={(item: FinancialCategoryOption) => ({
                label: item.description,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              // TASK-FE-687/DF-29 — obrigatório quando "Tipo Rateio"
              // (campo raiz do form) = Por Produto (`'P'`), mirror do
              // precedente `isRequired={!!generatesStock}` já usado nesta
              // mesma aba (required condicional a outro campo do form).
              isRequired={watch('apportionment_type')?.value === 'P'}
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`items.${index}.center_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.costCenter}
              placeholder={formText.placeholders.costCenter}
              service={listCostCenterOptions}
              mapOptions={(item: { uuid: string; code: string; description: string }) => ({
                label: `${item.code} — ${item.description}`,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                only_analytic: true,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              // TASK-FE-687/DF-29 — mesmo racional do Select de Categoria
              // acima.
              isRequired={watch('apportionment_type')?.value === 'P'}
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`items.${index}.cultivation_uuid`}
          control={control}
          render={({ field }) => (
            <SelectCultivation
              name={field.name}
              label={formText.fields.cultivation}
              placeholder={formText.placeholders.cultivation}
              value={field.value ?? null}
              onChange={(option) => field.onChange(option ?? null)}
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`items.${index}.ipi`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.ipi}
              allowDot
              decimalPlaces={2}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.icms`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.icms}
              allowDot
              decimalPlaces={2}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              disabled={isDisabled}
            />
          )}
        />
      </SimpleGrid>

      {/* ---- Lote (condicional) & Inventário (TASK-FE-646/DF-11) — já
          isolados hoje (hasLot condicional / toggle de inventário), só
          reposicionamento visual coerente com as seções acima; sem novo
          rótulo de seção (decisão da Tarefa, sem UX nova). ---- */}
      <SimpleGrid columns={columnsForm.default} gap={4} mt={4}>
        {hasLot && (
          <>
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
                  helperText={formText.hints.lotRequiredWhenHasLot}
                  disabled={isDisabled}
                />
              )}
            />
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {formText.fields.shelfLife}
              </Text>
              <Controller
                name={`items.${index}.shelf_life`}
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} disabled={isDisabled} />
                )}
              />
            </Box>
          </>
        )}

        <Controller
          name={`items.${index}.is_equipment`}
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={formText.fields.addsToInventory}
              name={name}
              value={
                [
                  { value: true, label: languageGB.defaltStrings.yes },
                  { value: false, label: languageGB.defaltStrings.no },
                ].find((option) => option.value === !!value) ?? null
              }
              onChange={(option: Option<boolean> | null) => {
                onChange(!!option?.value);
                if (!option?.value) {
                  setValue(`items.${index}.equipment`, null);
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
      </SimpleGrid>

      {isAgriculture && (
        // TASK-FE-625/DF-05 — ordem do legado (`_card-item.blade.php:266-303`):
        // Cultura → Área → Operação → Atividade, com cascata Operação→
        // Atividade (mirror EXATO de `TASK-FE-601`, Apontamentos).
        <SimpleGrid columns={columnsForm.fourColumns} gap={4} mt={4}>
          <Controller
            name={`items.${index}.aprop_cultivation_uuid`}
            control={control}
            render={({ field }) => (
              <SelectCultivation
                name={field.name}
                label={formText.fields.apropCultivation}
                placeholder={formText.placeholders.apropCultivation}
                value={field.value ?? null}
                onChange={(option) => field.onChange(option ?? null)}
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name={`items.${index}.aprop_area_uuid`}
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.area}
                placeholder={formText.placeholders.area}
                service={listAreasForActiveFarm}
                mapOptions={(item: AreaListItem) => ({ label: item.description, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
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

          <Controller
            name={`items.${index}.aprop_operation_uuid`}
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.operation}
                placeholder={formText.placeholders.operation}
                service={listOperations}
                // `id` numérico embutido na option (OperationResource expõe
                // id+uuid) — necessário para o filtro `operation_id` (int) de
                // `listActivities` (mirror EXATO TASK-FE-601/Apontamentos).
                mapOptions={(item: OperationListItem) => ({
                  label: item.name,
                  value: item.uuid,
                  id: item.id,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  // CASCATA — trocar a Operação invalida a Atividade
                  // escolhida (pode não pertencer à nova Operação).
                  setValue(`items.${index}.aprop_activity_uuid`, null);
                }}
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name={`items.${index}.aprop_activity_uuid`}
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.activity}
                placeholder={formText.placeholders.activity}
                service={listActivities}
                mapOptions={(item: ActivityListItem) => ({ label: item.name, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  // Cascata (mirror TASK-FE-601) — filtro real do backend é
                  // `operation_id` (int, id interno de `operations`, NÃO
                  // uuid). `id` vem embutido na option de Operação (acima).
                  operation_id: (watch(`items.${index}.aprop_operation_uuid`) as any)?.id,
                })}
                // Descarta o cache de opções quando a Operação muda — senão
                // o menu continuaria oferecendo Atividades da Operação
                // anterior (mesma correção de `CreateOrUpdateAppropriation.tsx`).
                cacheUniqs={[(watch(`items.${index}.aprop_operation_uuid`) as any)?.id]}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                // Gate de sequência (mirror TASK-FE-601) — Atividade só
                // habilita após escolher Operação.
                isDisabled={isDisabled || !watch(`items.${index}.aprop_operation_uuid`)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </SimpleGrid>
      )}

      {isEquipment && (
        <Box mt={4} p={3} bg="bg.muted" borderRadius="md">
          <Flex align="center" justify="space-between" gap={3}>
            <Text fontSize="xs" fontWeight="semibold">
              {formText.sections.equipment}
            </Text>
            {/* TASK-FE-648 (DF-18) — deixa de abrir um Dialog e passa a
                alternar (toggle) o painel inline colapsável abaixo; ícone
                chevron reflete o estado (mirror `Collapsible.Indicator`
                nativo do Chakra v3). */}
            <Button
              title={
                equipmentModalDisclosure.open
                  ? formText.equipmentModal.hideButton
                  : formText.equipmentModal.showButton
              }
              icon={(equipmentModalDisclosure.open ? FiChevronUp : FiChevronDown) as any}
              variant="outline"
              size="sm"
              onClick={equipmentModalDisclosure.onToggle}
              disabled={isDisabled}
            />
          </Flex>

          <InvoiceItemEquipmentPanel
            index={index}
            control={control}
            errors={errors}
            isOpen={equipmentModalDisclosure.open}
            onOpenChange={(open) =>
              open ? equipmentModalDisclosure.onOpen() : equipmentModalDisclosure.onClose()
            }
            isDisabled={isDisabled}
            equipmentStatusOptions={equipmentStatusOptions}
          />
        </Box>
      )}

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
