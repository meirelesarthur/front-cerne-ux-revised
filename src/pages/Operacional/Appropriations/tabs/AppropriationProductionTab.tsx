// src/pages/Operacional/Appropriations/tabs/AppropriationProductionTab.tsx
// -----------------------------------------------------------------------------
// Aba "Produção" — TASK-FE-2709 (extensão de fidelidade v1.1 §19-E1,
// `TASK-BE-998`, JÁ CONSTRUÍDO). `useFieldArray` de `production_items`:
// Produto + Un. Medida + Estoque + Quantidade + Quantidade Final + Vl.Unit
// (`amount`) + V.Total (`total`) + a matriz de qualidade de 13 campos
// percentuais (`PercentInput.tsx`, mesmo componente já usado em Pessoas/
// Centro de Custo) + Observação.
//
// TASK-FE-645 (AP-15 + AP-16, execução 034, 3ª leva pós-E2E) — parte
// desbloqueada desta Tarefa (layout/campos que NÃO dependem de backend):
// - AP-15: a coluna "(Kg)" (perda estimada, `0.00` sempre) foi REMOVIDA da
//   tela — deixou de ter valor de exibição própria. A fórmula que a
//   alimentava continua viva internamente (variável `estimatedLossKg`, por
//   linha) só porque ainda é a base de "Quantidade Final" (ver abaixo) —
//   nunca mais um `InputReadOnly` visível.
// - AP-15: ordem dos campos passou a espelhar o legado
//   (`_card_production.blade.php:5-30`): Produto → Un. Medida → Estoque →
//   Quantidade → Quantidade Final, todos ADJACENTES no mesmo `SimpleGrid` —
//   a antiga seção "CALCULADO EM TELA — NÃO ENVIADO" (rodapé) foi removida
//   por completo (ficaria vazia depois do reposicionamento).
// - AP-16: "Un. Medida" (`measurement_uuid`) — Select independente, mirror
//   EXATO de `stock_items.measurement_uuid` (aba Insumos,
//   `AppropriationStockTab.tsx`) — MESMA fonte (`listMeasurementOptions`),
//   sem endpoint novo, sem auto-preenchimento a partir do Produto.
// - AP-16/AP-15: "Estoque" deixou de ser a fórmula placeholder client-side
//   (`stock = finalQuantity`) e passou a ser DADO REAL, via `GET /stocks?
//   warehouse_uuid=<warehouse_production_uuid do cabeçalho>&product_uuid=
//   <produto da linha>`, SEM `allow_pointing` — contrato do GAP-BE-632
//   (`02-Gaps_Backend_API/`, aprovado pelo dono, opção b: default do
//   backend passa a ser "sem filtro", mirror exato do legado
//   `stockWarehouse`). Esse endpoint estava sendo finalizado em paralelo
//   pelo BE no momento desta entrega — o `product_uuid` é reenviado sempre,
//   e o client aplica o MESMO filtro em memória como salvaguarda enquanto o
//   servidor não filtra de verdade (nunca inventa saldo); resposta
//   vazia/sem match exibe "—", nunca quebra a tela. Readonly, nunca
//   enviado no payload (display-only, `Appropriation-contrato.md §19-E1`).
// - TASK-FE-713 (AP-16, execução 034) — "Estoque" agora aplica CONVERSÃO POR
//   FATOR (`factor`/`factor_type` do Produto, já embutidos na option desde
//   `GAP-BE-641`) quando a Un. Medida escolhida na linha é a SECUNDÁRIA do
//   produto: direção de PRODUÇÃO (`_production.blade.php:150-156`, Doc Bruta
//   07 §9) — `factor_type='M'` DIVIDE, `factor_type='D'` MULTIPLICA.
//   Instrução explícita do dono: essa direção é OPOSTA à de Insumos
//   (`TASK-FE-714`), preservada deliberadamente (não unificar). Transformação
//   só de EXIBIÇÃO sobre o dado já buscado — nunca propaga para "Quantidade
//   Final" nem para o payload.
// - "Quantidade Final" continua sendo DERIVADA DE TELA (nunca enviada) —
//   NENHUMA fonte real foi confirmada para ela nesta leva (só "Estoque" foi
//   desbloqueado, ver `TASK-FE-645`/`GAP-BE-632`); a fórmula de exibição
//   (`quantity − estimatedLossKg`) é a mesma já documentada desde
//   `TASK-FE-2709`, só mudou de POSIÇÃO visual (agora adjacente a
//   Quantidade, fidelidade ao legado) e deixou de expor o intermediário
//   "(Kg)" como campo próprio.
//
// Cálculo por linha (Estoque real via `useQuery`) exige 1 componente por
// linha — `ProductionItemRow` — para não violar Rules of Hooks dentro do
// `.map()` de `useFieldArray` (mirror EXATO do padrão já usado em
// `InvoiceItemsTab.tsx`/`InvoiceItemRow`, mesmo racional: "hook por linha =
// componente por linha").
//
// TASK-FE-660 (AP-19, execução 034, 4ª leva) — "V.Total" (`total`) deixou de
// ser um `NumberInput` editável independente: passa a ser `InputReadOnly`
// computado (`Vl.Unit × Quantidade`), recalculado ao vivo, mirror
// "Estoque"/"Quantidade Final" da mesma linha. O payload de submit
// (`CreateOrUpdateAppropriation.tsx`) computa o MESMO valor no momento do
// submit (nunca lê um `total` de tela, que ficaria stale sem `Controller`).
//
// TASK-FE-661 (AP-20+21+22, execução 034, 4ª leva) — cada uma das 13
// métricas da Matriz de Qualidade passou a mostrar o par `%`(editável) +
// `(Kg)`(readonly, calculado — reintroduz o intermediário que a AP-15 havia
// removido da TELA, agora como companheiro visível de cada `%`, não mais
// como campo solto). "Quantidade Final" passou a descontar a soma das 13
// perdas (era só 4/13: `damaged+burned+others+impurities`) MAIS o termo
// "+Estoque" (fórmula CONFIRMADA pelo Arquiteto API a partir da fonte
// primária do legado, `_production.blade.php:166-337`) — ver
// `qualityKgValues`/`finalQuantity` em `ProductionItemRow`. Decisão de
// implementação registrada: recálculo DO ZERO a cada mudança (via
// `watch()`), não replica o quirk de acúmulo incremental do legado (editar o
// MESMO campo % 2x sem passar por "Quantidade" acumulava a subtração
// incorretamente) — equivalente matematicamente quando cada campo é editado
// 1 única vez, mais robusto no geral.
//
// `amount`/`total` desta Tarefa são os valores de TELA (o que o usuário
// digita no create/update) — sobrescritos no `finish` pelo backend
// (`average_cost`).
//
// "Armazém de Produção" (`warehouse_production_uuid`) — MOVIDO de
// `CreateOrUpdateAppropriation.tsx` (aba Identificação) para o TOPO desta
// aba (TASK-FE-607/AP-07, achado da re-E2E). Cardinalidade INALTERADA — é
// campo de CABEÇALHO do Apontamento (1 por cadastro, coluna
// `appropriations.warehouse_production_id`, `Appropriation-contrato.md §2`),
// NUNCA um item de `production_items[]`/`useFieldArray` — diferente do
// Armazém de Insumos (`stock_items.{index}.warehouse_uuid`, 1 por linha).
// Só muda de ABA VISUAL; o `Controller` continua ligado ao MESMO `useForm`
// raiz (RHF não se importa em qual componente filho o `Controller` é
// renderizado) — payload/contrato inalterados.
// -----------------------------------------------------------------------------

import { Fragment } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listProductGroupOptions } from '@/services/v2/ProductGroups/product-group-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import { listStockAvailability } from '@/services/v2/Stocks/stock-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { AppropriationForm } from '@/@types/v2/Appropriations';
import type { ProductOption } from '@/@types/v2/Products';
import type { StockAvailabilityItem } from '@/@types/v2/Stocks';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

// TASK-FE-612/AP-10 (GAP-BE-612) — grupos elegíveis à aba Produção do
// Apontamento, mirror EXATO do legado (`group_id IN (8,18)`,
// `API/AppropriationController::production()`). O lookup enxuto
// (`GET /product-groups/options`) só expõe `{uuid,label}` — sem id/slug —
// então a resolução é por DESCRIÇÃO EXATA, a mesma string seedada verbatim
// por `GroupProductReference::PRODUCTION.label()`/`FEED.label()`
// (`GroupProductSeeder`, `GB.Cerne.Api`). O rótulo do grupo 18 ("Ração/
// Alimentação/Nutrição") é uma pendência de nomenclatura em OUTRO ciclo
// (GAP-BE-612, "Leitura do dev") — não afeta este filtro, que é por id
// físico (18), não pelo texto exibido ao usuário.
const APPROPRIATION_PRODUCTION_ELIGIBLE_GROUP_LABELS = [
  'Produção',
  'Ração / Alimentação / Nutrição',
];

export interface AppropriationProductionTabProps {
  control: Control<AppropriationForm>;
  errors: FieldErrors<AppropriationForm>;
  watch: UseFormWatch<AppropriationForm>;
  // TASK-FE-662/AP-18 — necessário para limpar `measurement_uuid` da linha
  // quando o Produto muda (cascata, mirror `AppropriationStockTab.tsx`).
  setValue: UseFormSetValue<AppropriationForm>;
  isLoading: boolean;
  canSave: boolean;
  // TASK-FE-610/AP-09 — banner "≥1 item" agora lido de estado do componente
  // pai (setado só no onSubmit), não mais de `errors.production_items?.message`.
  itemsError: string | null;
  /** TASK-FE-735 (execução 034/035, GAP-BE-655) — `true` só na Finalização
   *  (`FinishAppropriation.tsx`, TASK-FE-737): trava o campo de CABEÇALHO
   *  "Armazém de Produção" (`warehouse_production_uuid`, fora do
   *  `useFieldArray`) +, por linha, Produto/Un.Medida (repassado a
   *  `ProductionItemRow`). Estoque/Quantidade Final/V.Total/13%/Observação
   *  continuam editáveis/calculados em qualquer modo. Default
   *  `false`/`undefined` preserva `CreateOrUpdateAppropriation.tsx` 100%
   *  inalterado. */
  lockIdentityFields?: boolean;
  /** TASK-FE-735 — `true` esconde "+ Adicionar Item" e a lixeira (mirror
   *  `AppropriationLaborTab.tsx`/TASK-FE-732). */
  hideRowActions?: boolean;
}

const QUALITY_FIELDS = [
  'ph',
  'phm',
  'damaged',
  'burned',
  'others',
  'impurities',
  'qb_impurities',
  'moisture',
  'qb_moisture',
  'rate',
  'qb_technique',
  'cleaning_drying',
  'broken',
] as const;

type QualityLabels = Record<(typeof QUALITY_FIELDS)[number], string>;

// TASK-FE-661 (AP-20+21+22, execução 034) — mapa campo % → chave de label do
// par "(Kg)" companheiro (`ModuleAppropriations`, `production.fields.
// {campo}Kg`), consumido por `QUALITY_KG_LABELS` abaixo.
const QUALITY_KG_LABEL_KEYS: Record<
  (typeof QUALITY_FIELDS)[number],
  | 'phKg'
  | 'phmKg'
  | 'damagedKg'
  | 'burnedKg'
  | 'othersKg'
  | 'impuritiesKg'
  | 'qbImpuritiesKg'
  | 'moistureKg'
  | 'qbMoistureKg'
  | 'rateKg'
  | 'qbTechniqueKg'
  | 'cleaningDryingKg'
  | 'brokenKg'
> = {
  ph: 'phKg',
  phm: 'phmKg',
  damaged: 'damagedKg',
  burned: 'burnedKg',
  others: 'othersKg',
  impurities: 'impuritiesKg',
  qb_impurities: 'qbImpuritiesKg',
  moisture: 'moistureKg',
  qb_moisture: 'qbMoistureKg',
  rate: 'rateKg',
  qb_technique: 'qbTechniqueKg',
  cleaning_drying: 'cleaningDryingKg',
  broken: 'brokenKg',
};

export function AppropriationProductionTab({
  control,
  errors,
  watch,
  setValue,
  isLoading,
  canSave,
  itemsError,
  lockIdentityFields = false,
  hideRowActions = false,
}: AppropriationProductionTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.appropriations.appropriation.form;
  const fields13 = formText.production.fields;

  const QUALITY_LABELS: QualityLabels = {
    ph: fields13.ph,
    phm: fields13.phm,
    damaged: fields13.damaged,
    burned: fields13.burned,
    others: fields13.others,
    impurities: fields13.impurities,
    qb_impurities: fields13.qbImpurities,
    moisture: fields13.moisture,
    qb_moisture: fields13.qbMoisture,
    rate: fields13.rate,
    qb_technique: fields13.qbTechnique,
    cleaning_drying: fields13.cleaningDrying,
    broken: fields13.broken,
  };

  // TASK-FE-661 — label do par "(Kg)" readonly de cada métrica, mesma fonte
  // i18n (`fields13`), sem string hardcoded.
  const QUALITY_KG_LABELS: QualityLabels = QUALITY_FIELDS.reduce((acc, field) => {
    acc[field] = fields13[QUALITY_KG_LABEL_KEYS[field]];
    return acc;
  }, {} as QualityLabels);

  const { fields, append, remove } = useFieldArray({ control, name: 'production_items' });

  // TASK-FE-612/AP-10 — resolve os uuids dos grupos elegíveis (id 8+18) UMA
  // vez, via o lookup já existente e sem gate (`GET /product-groups/options`,
  // GAP-BE-612 "Leitura do dev") — nenhum endpoint novo de resolução.
  const productionEligibleGroupUuidsQuery = useQuery({
    queryKey: ['appropriation-production-eligible-group-uuids'],
    queryFn: async () => {
      const response = await listProductGroupOptions({});
      return response.data.items
        .filter((group) => APPROPRIATION_PRODUCTION_ELIGIBLE_GROUP_LABELS.includes(group.label))
        .map((group) => group.uuid);
    },
    staleTime: 5 * 60 * 1000,
  });

  const isDisabled = !canSave || isLoading;

  function handleAdd() {
    append({
      product_uuid: null,
      measurement_uuid: null,
      quantity: null,
      note: null,
      amount: null,
      total: null,
      ph: null,
      phm: null,
      damaged: null,
      burned: null,
      others: null,
      impurities: null,
      qb_impurities: null,
      moisture: null,
      qb_moisture: null,
      rate: null,
      qb_technique: null,
      cleaning_drying: null,
      broken: null,
    });
  }

  return (
    <Box pt={4}>
      {/* "Armazém de Produção" — campo ÚNICO de cabeçalho de aba (TASK-FE-607/
          AP-07), NÃO item de `production_items[]`; fora do `useFieldArray`.
          TASK-FE-735 (GAP-BE-655) — trava como `InputReadOnly` na
          Finalização (mirror `_production.blade.php:12-14`, readonly). */}
      <SimpleGrid columns={columnsForm.default} gap={4} mb={5}>
        <Controller
          name="warehouse_production_uuid"
          control={control}
          render={({ field }) =>
            lockIdentityFields ? (
              <InputReadOnly
                label={formText.fields.warehouseProduction}
                value={field.value?.label ?? '—'}
              />
            ) : (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.warehouseProduction}
                placeholder={formText.placeholders.warehouseProduction}
                service={listWarehouseOptions}
                mapOptions={(item: WarehouseOption) => ({
                  label: `${item.initials} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  // TASK-FE-611/AP-08 (GAP-BE-610/TASK-BE-1003) — só
                  // Armazéns de tipo Produção aparecem no campo de
                  // cabeçalho da aba.
                  type: 'producao',
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )
          }
        />
      </SimpleGrid>

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
        <Flex direction="column" gap={5} mb={4}>
          {fields.map((field, index) => (
            <ProductionItemRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isDisabled={isDisabled}
              qualityLabels={QUALITY_LABELS}
              qualityKgLabels={QUALITY_KG_LABELS}
              eligibleGroupUuids={productionEligibleGroupUuidsQuery.data}
              lockIdentityFields={lockIdentityFields}
              hideRowActions={hideRowActions}
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
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Linha de item — componente próprio (1 componente por linha, mirror
// `InvoiceItemRow`/`InvoiceItemsTab.tsx`) para permitir o `useQuery` de
// "Estoque" (GAP-BE-632) por linha sem violar Rules of Hooks.
// -----------------------------------------------------------------------------

interface ProductionItemRowProps {
  index: number;
  control: Control<AppropriationForm>;
  errors: FieldErrors<AppropriationForm>;
  watch: UseFormWatch<AppropriationForm>;
  setValue: UseFormSetValue<AppropriationForm>;
  isDisabled: boolean;
  qualityLabels: QualityLabels;
  // TASK-FE-661 — labels do par "(Kg)" readonly de cada métrica.
  qualityKgLabels: QualityLabels;
  // TASK-FE-612/AP-10 — lookup ÚNICO da aba (não por linha), reusado via prop
  // (mirror `eligibleAppropriationTypeValues` de `InvoiceItemRow`).
  eligibleGroupUuids: string[] | undefined;
  // TASK-FE-735 (GAP-BE-655) — mirror EXATO das props de máscara já usadas
  // em `AppropriationLaborTab.tsx`/`AppropriationStockTab.tsx`/
  // `AppropriationEquipmentTab.tsx`.
  lockIdentityFields: boolean;
  hideRowActions: boolean;
  onRemove: () => void;
}

function ProductionItemRow({
  index,
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  qualityLabels,
  qualityKgLabels,
  eligibleGroupUuids,
  lockIdentityFields,
  hideRowActions,
  onRemove,
}: ProductionItemRowProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.appropriations.appropriation.form;

  const rowErrors = errors.production_items?.[index];

  const warehouseProductionUuid = (watch('warehouse_production_uuid') as any)?.value as
    string | undefined;
  const productOption = watch(`production_items.${index}.product_uuid`) as
    | (Option<string> & {
        measurement?: Option<string> | null;
        measurementSecond?: Option<string> | null;
        factor?: number | null;
        factorType?: { value: 'M' | 'D'; label: string } | null;
      })
    | null
    | undefined;
  const productUuid = productOption?.value as string | undefined;
  const selectedMeasurementUuid = (
    watch(`production_items.${index}.measurement_uuid`) as Option<string> | null | undefined
  )?.value;

  // TASK-FE-645 (AP-15/AP-16, execução 034) — "Estoque" REAL, GAP-BE-632
  // (`GET /stocks?warehouse_uuid=<produção>&product_uuid=<produto>`, SEM
  // `allow_pointing`). Habilitado só com Armazém de Produção (cabeçalho) E
  // Produto (desta linha) escolhidos. O endpoint estava sendo finalizado em
  // paralelo pelo BE nesta mesma sessão — enquanto `product_uuid` não
  // filtra de verdade no servidor, o `.find()` abaixo aplica o MESMO filtro
  // em memória como salvaguarda; sem match, cai no `null` (exibe "—"),
  // nunca inventa saldo nem quebra a tela.
  const stockQuery = useQuery({
    queryKey: ['appropriation-production-stock', warehouseProductionUuid, productUuid],
    queryFn: async () => {
      const response = await listStockAvailability({
        warehouse_uuid: warehouseProductionUuid,
        product_uuid: productUuid,
      });
      const items = response.data.items ?? [];
      return (
        items.find((item: StockAvailabilityItem) => item.product.uuid === productUuid) ??
        items[0] ??
        null
      );
    },
    enabled: Boolean(warehouseProductionUuid) && Boolean(productUuid),
    staleTime: 60 * 1000,
    retry: false,
  });

  // TASK-FE-713 (AP-16, execução 034) — conversão por fator sobre o
  // "Estoque" exibido, DIREÇÃO DE PRODUÇÃO (`_production.blade.php:150-156`,
  // Doc Bruta 07 §9): decisão explícita do dono, NÃO unificada com a direção
  // de Insumos (`TASK-FE-714`, oposta de propósito — M divide aqui, M
  // multiplica lá). Convertida SOMENTE quando a Un. Medida escolhida na
  // linha é a SECUNDÁRIA do produto (nativa = sem conversão); sem
  // `factor`/`factor_type` configurado, cai no bruto (nunca quebra a tela).
  // Transformação de EXIBIÇÃO em cima do dado já buscado — não propaga para
  // "Quantidade Final" nem para o payload.
  const rawStockQuantity = stockQuery.data ? Number(stockQuery.data.quantity) : null;

  function convertProductionStock(raw: number): number {
    const nativeMeasurementUuid = productOption?.measurement?.value;
    const isNativeMeasurement =
      !selectedMeasurementUuid || selectedMeasurementUuid === nativeMeasurementUuid;
    if (isNativeMeasurement) return raw;

    const factor = productOption?.factor;
    const factorType = productOption?.factorType?.value;
    if (!factor || factor <= 0) return raw;

    if (factorType === 'M') return raw / factor;
    if (factorType === 'D') return raw * factor;
    return raw;
  }

  const stockDisplayValue =
    rawStockQuantity !== null
      ? convertProductionStock(rawStockQuantity).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '—';

  const quantity = Number(watch(`production_items.${index}.quantity`)) || 0;
  const amount = Number(watch(`production_items.${index}.amount`)) || 0;

  // TASK-FE-661 (AP-20+21+22, execução 034) — fórmula EXATA extraída da
  // fonte primária do legado (`_production.blade.php:166-337`), CONFIRMADA
  // pelo Arquiteto API (roteiro cruzado da mesma sessão, sem ressalva,
  // incluindo o termo "+Estoque"): `{metrica}_kg = ({metrica}% × Quantidade)
  // / 100` para cada 1 das 13 métricas — SEMPRE sobre a Quantidade ORIGINAL
  // da linha (nunca a Quantidade Final corrente). Decisão de implementação
  // documentada (task-packet): "Quantidade Final" é recalculada DO ZERO a
  // cada render/mudança (via `watch()`), não replica o quirk de acúmulo
  // incremental do legado (editar o MESMO campo % 2x sem passar por
  // "Quantidade" acumulava a subtração) — equivalente matematicamente
  // quando cada campo é editado 1 única vez, mais robusto no geral.
  const qualityKgValues = QUALITY_FIELDS.reduce(
    (acc, field) => {
      const percent = Number(watch(`production_items.${index}.${field}`)) || 0;
      acc[field] = (percent * quantity) / 100;
      return acc;
    },
    {} as Record<(typeof QUALITY_FIELDS)[number], number>
  );

  const totalQualityLossKg = QUALITY_FIELDS.reduce((sum, field) => sum + qualityKgValues[field], 0);

  const stockQuantity = stockQuery.data ? Number(stockQuery.data.quantity) : 0;

  // "Quantidade Final" = Quantidade + Estoque − Σ(13 perdas em Kg) — fórmula
  // CONFIRMADA pelo Arquiteto API (o termo "+Estoque" NÃO é simplificação
  // incorreta). Derivada de TELA, nunca enviada (ver cabeçalho do arquivo).
  const finalQuantity = Math.max(quantity + stockQuantity - totalQualityLossKg, 0);

  // "V.Total" — TASK-FE-660 (AP-19) — cálculo INDEPENDENTE da matriz de
  // qualidade (mirror `_production.blade.php:166-171`/`_card_production.
  // blade.php:35`): Vl.Unit × Quantidade, readonly, recalculado ao vivo.
  const totalValue = amount * quantity;

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      {/* ---- Produto → Un. Medida → Estoque → Quantidade → Quantidade Final
          (AP-15/AP-16 — ordem do legado, `_card_production.blade.php:5-30`,
          todos ADJACENTES no mesmo grid) ---- */}
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`production_items.${index}.product_uuid`}
          control={control}
          render={({ field: rowField }) =>
            lockIdentityFields ? (
              <InputReadOnly
                label={formText.production.fields.product}
                value={rowField.value?.label ?? '—'}
              />
            ) : (
              <SelectAsyncPaginate
                name={rowField.name}
                label={formText.production.fields.product}
                placeholder={formText.production.placeholders.product}
                error={rowErrors?.product_uuid?.message as string | undefined}
                // TASK-FE-612/AP-10 (GAP-BE-612/TASK-BE-1005) — troca de
                // `listProducts` (CRUD completo, sem filtro de grupo em
                // lote) para o lookup enxuto `products/options`, agora com
                // `group_uuid[]` (união dos grupos 8+18, mirror legado
                // `group_id IN (8,18)`).
                service={listProductOptions}
                mapOptions={(item: ProductOption) => ({
                  label: item.code ? `${item.code} — ${item.description}` : item.description,
                  value: item.uuid,
                  // TASK-FE-662/AP-18 (GAP-BE-641) — embute as 1-2 unidades
                  // válidas DO PRODUTO na própria option (mirror `quantity`/
                  // `measurement` embutidos em `AppropriationStockTab.tsx`,
                  // TASK-FE-663), sem round-trip extra: o Select de "Un.
                  // Medida" abaixo lê estes 2 campos da option corrente.
                  measurement: item.measurement
                    ? { label: item.measurement.description, value: item.measurement.uuid }
                    : null,
                  measurementSecond: item.measurement_second
                    ? {
                        label: item.measurement_second.description,
                        value: item.measurement_second.uuid,
                      }
                    : null,
                  // TASK-FE-713 (AP-16, execução 034) — fator/tipo do
                  // produto, embutidos na option (mesma fonte
                  // `ProductOption`, sem round-trip extra) para converter
                  // "Estoque" quando a Un. Medida escolhida na linha for a
                  // SECUNDÁRIA.
                  factor: item.factor ?? null,
                  factorType: item.factor_type ?? null,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  group_uuid: eligibleGroupUuids ?? [],
                })}
                // Descarta o cache quando os uuids de grupo resolvem (1ª
                // renderização nasce sem eles) — evita oferecer um menu já
                // aberto sem o filtro correto.
                cacheUniqs={[eligibleGroupUuids?.join(',')]}
                value={rowField.value ?? undefined}
                onChange={(option: any) => {
                  rowField.onChange(option ?? null);
                  // TASK-FE-662/AP-18 — trocar o Produto invalida a Un.
                  // Medida escolhida (pertencia ao produto anterior); mirror
                  // cascata Armazém→Produto de `AppropriationStockTab.tsx`.
                  // TASK-FE-681/AP-27 — dedupe por uuid: quando o produto
                  // tem as 2 unidades IGUAIS (measurement.uuid ===
                  // measurementSecond.uuid) ou só tem 1 unidade cadastrada,
                  // resta exatamente 1 opção válida após dedupe —
                  // auto-seleciona (mirror `AppropriationStockTab.tsx:
                  // 208-219`); com 2 opções distintas, o campo fica vazio
                  // para escolha manual.
                  const dedupedMeasurements = Array.from(
                    new Map(
                      [option?.measurement, option?.measurementSecond]
                        .filter((candidate): candidate is Option<string> => Boolean(candidate))
                        .map((candidate) => [candidate.value, candidate])
                    ).values()
                  );
                  setValue(
                    `production_items.${index}.measurement_uuid`,
                    dedupedMeasurements.length === 1 ? dedupedMeasurements[0] : null
                  );
                }}
                isRequired
                isDisabled={isDisabled || !eligibleGroupUuids}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )
          }
        />

        {/* Un. Medida — TASK-FE-662/AP-18 (GAP-BE-641): deixou de ser
            catálogo genérico (`listMeasurementOptions`, TASK-FE-645) — agora
            restrito às 1-2 unidades DO PRODUTO selecionado nesta linha
            (primária sempre, secundária condicional), embutidas na própria
            option de Produto (ver Controller acima). Gateado até o Produto
            ser escolhido; Select LOCAL (não `SelectAsyncPaginate` — o
            catálogo já está resolvido em memória, sem endpoint novo).
            TASK-FE-735 — trava como `InputReadOnly` na Finalização. */}
        <Controller
          name={`production_items.${index}.measurement_uuid`}
          control={control}
          render={({ field: rowField }) => {
            // TASK-FE-681/AP-27 — dedupe por `uuid` (Lei 10 — chave real,
            // mais robusto que dedupe por `label`): quando `measurement` e
            // `measurementSecond` são a MESMA unidade, o Select nunca mostra
            // a opção duplicada.
            const measurementOptions = Array.from(
              new Map(
                [productOption?.measurement, productOption?.measurementSecond]
                  .filter((option): option is Option<string> => Boolean(option))
                  .map((option) => [option.value, option])
              ).values()
            );

            if (lockIdentityFields) {
              return (
                <InputReadOnly
                  label={formText.production.fields.measurement}
                  value={rowField.value?.label ?? '—'}
                />
              );
            }

            return (
              <Select
                name={rowField.name}
                label={formText.production.fields.measurement}
                placeholder={formText.production.placeholders.measurement}
                value={rowField.value ?? null}
                onChange={(option) => rowField.onChange(option ?? null)}
                options={measurementOptions}
                // TASK-FE-681/AP-27 — com só 1 opção útil após dedupe (2
                // unidades iguais OU produto com só 1 unidade cadastrada), o
                // campo fica travado (sem escolha real possível); com 2
                // opções distintas, comportamento inalterado (habilitado).
                isDisabled={isDisabled || !productUuid || measurementOptions.length <= 1}
              />
            );
          }}
        />

        {/* Estoque — TASK-FE-645/AP-15+AP-16, GAP-BE-632. Readonly,
            display-only, NUNCA enviado (`Appropriation-contrato.md §19-E1`). */}
        <InputReadOnly label={formText.production.fields.stock} value={stockDisplayValue} />

        <Controller
          name={`production_items.${index}.quantity`}
          control={control}
          render={({ field: rowField }) => (
            <NumberInput
              name={rowField.name}
              label={formText.production.fields.quantity}
              allowDot
              decimalPlaces={2}
              value={rowField.value ?? null}
              onValueChange={(value) => rowField.onChange(value)}
              error={rowErrors?.quantity?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        {/* Quantidade Final — readonly, derivada de TELA (ver cabeçalho do
            arquivo), nunca enviada; reposicionada para adjacente a
            Quantidade (AP-15, fidelidade ao legado). TASK-FE-661 — fórmula
            passou a descontar as 13 perdas + Estoque (era só 4/13) e a
            formatação ganhou separador de milhar pt-BR (era `toFixed(2)`). */}
        <InputReadOnly
          label={formText.production.fields.finalQuantity}
          value={finalQuantity.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        />
      </SimpleGrid>

      {/* ---- Valores (Vl.Unit/V.Total) — sobrescritos no finish ---- */}
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        mt={4}
        mb={2}
      >
        {formText.production.sections.values}
      </Text>
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`production_items.${index}.amount`}
          control={control}
          render={({ field: rowField }) => (
            <NumberInput
              name={rowField.name}
              label={formText.production.fields.amount}
              allowDot
              decimalPlaces={2}
              value={rowField.value ?? null}
              onValueChange={(value) => rowField.onChange(value)}
              disabled={isDisabled}
            />
          )}
        />
        {/* TASK-FE-660 (AP-19) — "V.Total" deixou de ser `Controller`+
            `NumberInput` editável independente — passa a ser `InputReadOnly`
            computado (`Vl.Unit × Quantidade`), recalculado ao vivo, mirror
            "Estoque"/"Quantidade Final" da mesma linha. Payload de submit
            (`CreateOrUpdateAppropriation.tsx`) usa o MESMO cálculo no
            momento do submit, nunca este valor de tela (que não existe mais
            como campo RHF editável). */}
        <InputReadOnly
          label={formText.production.fields.total}
          value={totalValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        />
      </SimpleGrid>

      {/* ---- Matriz de Qualidade (13 campos, v1.1 §19-E1) ---- */}
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        mt={4}
        mb={2}
      >
        {formText.production.sections.quality}
      </Text>
      {/* TASK-FE-661 (AP-20+21+22) — cada métrica agora mostra o par `%`
          (editável, `PercentInput`) + `(Kg)` (readonly, calculado ao vivo —
          `{metrica}_kg = ({metrica}% × Quantidade) / 100`), mirror do par
          Estoque/Qtd Total já usado em `AppropriationStockTab.tsx`. */}
      <SimpleGrid columns={columnsForm.fourColumns} gap={4}>
        {QUALITY_FIELDS.map((qualityField) => (
          <Fragment key={qualityField}>
            <Controller
              name={`production_items.${index}.${qualityField}`}
              control={control}
              render={({ field: rowField }) => (
                <PercentInput
                  name={rowField.name}
                  label={qualityLabels[qualityField]}
                  maxValue={100}
                  value={rowField.value ?? null}
                  onValueChange={(value) => rowField.onChange(value)}
                  disabled={isDisabled}
                />
              )}
            />
            <InputReadOnly
              label={qualityKgLabels[qualityField]}
              value={qualityKgValues[qualityField].toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            />
          </Fragment>
        ))}
      </SimpleGrid>

      {/* ---- Observação (TASK-FE-644/AP-17 — depois da Matriz de
          Qualidade) ---- */}
      <Box mt={4}>
        <Controller
          name={`production_items.${index}.note`}
          control={control}
          render={({ field: rowField }) => (
            <Input
              label={formText.production.fields.note}
              name={rowField.name}
              value={rowField.value ?? ''}
              onChange={(e) => rowField.onChange(e.target.value)}
              disabled={isDisabled}
            />
          )}
        />
      </Box>

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
