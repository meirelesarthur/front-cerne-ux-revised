// src/pages/Invoices/InvoiceItemEquipmentPanel.tsx
// -----------------------------------------------------------------------------
// Painel INLINE colapsável "Dados do Bem para Inventário" — TASK-FE-648
// (DF-18, REWORK sobre TASK-FE-629/630/631, execução 035). O dono avaliou o
// resultado do Modal Form (Dialog v3) e decidiu que a experiência de MODAL
// não funciona bem para este fluxo — os ~24 campos passam a renderizar
// INLINE, dentro do próprio card do item, num container que expande/contrai
// (`Collapsible.Root`/`Collapsible.Content` nativo do Chakra UI v3 — Passo UX
// confirmou que o `CollapsibleSection` já adaptado do `cerne`
// (`src/components/Form/CollapsibleSection.tsx`, 3 consumidores) é
// UNCONTROLLED (`defaultOpen` só na 1ª renderização) e não expõe
// open/onOpenChange controlado por linha; como esta Tarefa exige controle
// EXTERNO por linha via `equipmentModalDisclosure` já existente — múltiplos
// itens `is_equipment` expandidos/colapsados independentemente pelo próprio
// botão-gatilho do pai — adaptamos o primitivo `Collapsible` diretamente
// (mesma dependência, zero lib nova), em vez de estender um componente
// compartilhado por outras 3 telas fora do escopo desta Tarefa).
//
// CONTRATO/CAMPOS INALTERADOS (GAP-BE-623/TASK-BE-623, já confirmado pelo
// Arquiteto API) — esta Tarefa é PURAMENTE de container de UI: os mesmos ~24
// `Controller`s (Identificação/Fiscal-Veículo/Financeiro-Depreciação, mesmos
// 3 `Tabs.Root`/`Tabs.Content` internos preservados 1:1) continuam
// renderizando idêntico, só o CHROME externo mudou (Dialog/Portal → Box
// colapsável).
//
// ⚠️ SEM `useMutation` própria. Os campos são `Controller`s do MESMO
// `useForm` RAIZ de Invoice (`items.${index}.equipment.*`, recebido via
// `control`/`errors` do PAI, `InvoiceItemsTab.tsx`) — a persistência acontece
// no submit do form PRINCIPAL de Invoice
// (`CreateOrUpdateInvoice.tsx::tryPersistInvoice`).
//
// Mirror 1:1 de Controllers/labels/máscaras/validação já testados no módulo
// Equipamento dedicado (decisão do Arquiteto API, GAP-BE-623/TASK-BE-623):
//   - `CreateOrUpdateEquipamento.tsx` → aba "Identificação" (casca).
//   - `EquipamentoFiscalVeiculoTab.tsx` → aba "Fiscal/Veículo" (5 campos:
//     chassi/renavam/serie/plate/uf — o bloco Fiscal de 12 campos
//     condicionais a `use_fiscal` NÃO entra, GAP-BE-623 §1: Invoice sempre
//     grava `use_fiscal=0`, esse bloco nunca se aplica aqui).
//   - `EquipamentoFinanceiroDepreciacaoTab.tsx` → aba "Financeiro/
//     Depreciação" (RN-2: `vl_residual`/`vl_depreciate` são PREVIEW
//     client-side, calculados aqui mirror EXATO da mesma fórmula — nunca
//     enviados no payload, o servidor sempre recalcula, GAP-BE-623 §
//     "Campos read-only excluídos").
//
// `equipment_type` — fixo `'P'` (Próprio), `InputReadOnly` sem Controller:
// Doc.Fiscal só CRIA bens PRÓPRIOS (nunca de terceiro, RN-5 do módulo
// Equipamento dedicado não se aplica a este fluxo — decisão de simplicação
// registrada no relatório de entrega, não lacuna).
//
// `uf` guarda o CÓDIGO CRU (`string`), mirror EXATO de `EquipmentForm.uf` —
// bulk fetch (1x) de `/states/options` filtrado por Brasil, mesma técnica de
// `EquipamentoFiscalVeiculoTab.tsx` (`fetchEquipmentFormStateOptions`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Collapsible, SimpleGrid, Tabs, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useWatch } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';
import { BRAZIL_COUNTRY_CODE } from '@/constants/countries';
import { FamilyEquipmentDepreciationType } from '@/constants/FamilyEquipmentDepreciationType';

import { listFamilyEquipmentOptions } from '@/services/v2/BaseRegistrations/familyEquipment-service';
import { listProprietaries } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listStateOptions } from '@/services/v2/States/state-service';

import type { Option } from '@/@types/option';
import type { FamilyEquipmentOption } from '@/@types/v2/BaseRegistrations/familyEquipment';
import type { InvoiceForm } from '@/@types/v2/Invoices';
import type { StateOption } from '@/@types/v2/States';

import type { Control, FieldErrors } from 'react-hook-form';

export interface InvoiceItemEquipmentPanelProps {
  index: number;
  control: Control<InvoiceForm>;
  errors: FieldErrors<InvoiceForm>;
  /** Estado de expandido/colapsado — controlado pelo `useDisclosure` POR
   *  LINHA do pai (`equipmentModalDisclosure`, `InvoiceItemsTab.tsx`), mesmo
   *  hook que antes controlava o Dialog (TASK-FE-648). */
  isOpen: boolean;
  /** Espelha o `onOpenChange` do `Collapsible.Root` — o pai decide
   *  onOpen/onClose a partir do `details.open`. */
  onOpenChange: (open: boolean) => void;
  isDisabled: boolean;
  equipmentStatusOptions: Option<number>[];
}

type EquipmentPanelTabKey = '0' | '1' | '2';

// Código IBGE do Brasil vem da fonte única `@/constants/countries`
// (TASK-072-FE-01), mesmo racional de `EquipamentoFiscalVeiculoTab.tsx`.

async function fetchStateOptions(): Promise<StateOption[]> {
  const response = await listStateOptions({
    per_page: 100,
    country_code: String(BRAZIL_COUNTRY_CODE),
  });
  return response.data.items;
}

// Mirror `formatCurrencyBRL` de `InvoiceItemsTab.tsx` — duplicado de
// propósito (formatação trivial, não fórmula de negócio; ver racional já
// documentado no cabeçalho daquele arquivo para duplicação de helpers
// triviais entre arquivos da mesma tela).
function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function InvoiceItemEquipmentPanel({
  index,
  control,
  errors,
  isOpen,
  onOpenChange,
  isDisabled,
  equipmentStatusOptions,
}: InvoiceItemEquipmentPanelProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.invoices.invoice.form;

  const [tabValue, setTabValue] = useState<EquipmentPanelTabKey>('0');

  const rowErrors = errors.items?.[index]?.equipment;

  // Preview RN-2 (mirror EXATO de `EquipamentoFinanceiroDepreciacaoTab.tsx`)
  // — `vl_residual`/`vl_depreciate` NUNCA são campos do form (fora de
  // `InvoiceItemEquipmentForm`/payload, GAP-BE-623 confirma que o backend
  // sempre recalcula, nunca aceita do client) — só leitura reativa via
  // `useWatch` para exibir o mesmo cálculo como `InputReadOnly`.
  const depreciationType = useWatch({
    control,
    name: `items.${index}.equipment.depreciation_type`,
  });
  const vlAcquisition = useWatch({ control, name: `items.${index}.equipment.vl_acquisition` });
  const residual = useWatch({ control, name: `items.${index}.equipment.residual` });

  const isComResidual = depreciationType === FamilyEquipmentDepreciationType.COM_RESIDUAL;
  const vlResidualPreview = isComResidual
    ? Number(((Number(vlAcquisition ?? 0) * Number(residual ?? 0)) / 100).toFixed(2))
    : 0;
  const vlDepreciatePreview = Number((Number(vlAcquisition ?? 0) - vlResidualPreview).toFixed(2));

  const stateOptionsQuery = useQuery({
    queryKey: ['invoice-item-equipment-modal-state-options'],
    queryFn: fetchStateOptions,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    enabled: isOpen,
  });

  const stateOptions: Option<string>[] = (stateOptionsQuery.data ?? []).map((item) => ({
    label: `${item.title} (${item.letter})`,
    value: item.letter,
  }));

  const hasDepreciationOptions: Option<boolean>[] = [
    { value: true, label: languageGB.defaltStrings.yes },
    { value: false, label: languageGB.defaltStrings.no },
  ];

  const depreciationTypeOptions: Option<number>[] = [
    {
      value: FamilyEquipmentDepreciationType.SEM_RESIDUAL,
      label: formText.fields.equipmentDepreciationTypeWithoutResidual,
    },
    {
      value: FamilyEquipmentDepreciationType.COM_RESIDUAL,
      label: formText.fields.equipmentDepreciationTypeWithResidual,
    },
  ];

  return (
    // TASK-FE-648 (DF-18) — container inline colapsável (era Dialog/Portal).
    // `open`/`onOpenChange` controlados pelo `equipmentModalDisclosure` do
    // pai (POR LINHA) — múltiplos itens `is_equipment` expandem/colapsam
    // independentemente. `lazyMount`/`unmountOnExit` preservam o mesmo
    // comportamento de performance que o Dialog já tinha (~24 campos só
    // montam quando expandido).
    <Collapsible.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => onOpenChange(details.open)}
      lazyMount
      unmountOnExit
    >
      <Collapsible.Content>
        <Box
          mt={3}
          p={4}
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="md"
          bg="bg.panel"
        >
          <Text fontSize="sm" fontWeight="semibold" mb={3}>
            {formText.sections.equipmentModalTitle}
          </Text>

          {/* @ts-ignore - custom variant */}
          <Tabs.Root
            value={tabValue}
            onValueChange={(details: { value: string }) =>
              setTabValue(details.value as EquipmentPanelTabKey)
            }
            variant={'secondary' as any}
          >
            {/* @ts-ignore */}
            <Tabs.List>
              {/* @ts-ignore */}
              <Tabs.Trigger value="0">{formText.equipmentModal.tabs.identification}</Tabs.Trigger>
              {/* @ts-ignore */}
              <Tabs.Trigger value="1">{formText.equipmentModal.tabs.fiscalVehicle}</Tabs.Trigger>
              {/* @ts-ignore */}
              <Tabs.Trigger value="2">{formText.equipmentModal.tabs.financial}</Tabs.Trigger>
            </Tabs.List>

            {/* ---- ABA 1: Identificação (TASK-FE-629) ---- */}
            {/* @ts-ignore */}
            <Tabs.Content value="0">
              <SimpleGrid columns={columnsForm.default} gap={4} pt={4}>
                <Controller
                  name={`items.${index}.equipment.family_equipment_uuid`}
                  control={control}
                  render={({ field }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={formText.fields.equipmentFamily}
                      placeholder={formText.placeholders.equipmentFamily}
                      error={rowErrors?.family_equipment_uuid?.message as string | undefined}
                      // TASK-FE-652 (DF-17) — `listFamilyEquipments`
                      // (CRUD completo, gateado por
                      // `familyequipments_view`) trocado pelo lookup
                      // ENXUTO `/family-equipments/options` (UNGATED
                      // desde TASK-BE-705) — usuários sem a permissão de
                      // ver o cadastro dedicado deixam de receber 403
                      // "Sem permissão" neste Select.
                      service={listFamilyEquipmentOptions}
                      mapOptions={(item: FamilyEquipmentOption) => ({
                        label: item.description,
                        value: item.uuid,
                      })}
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
                  name={`items.${index}.equipment.description`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      label={formText.fields.equipmentDescription}
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={rowErrors?.description?.message as string | undefined}
                      isRequired
                      disabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.proprietary_uuid`}
                  control={control}
                  render={({ field }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={formText.fields.equipmentProprietary}
                      placeholder={formText.placeholders.equipmentProprietary}
                      service={listProprietaries}
                      mapOptions={(item: { uuid: string; name: string }) => ({
                        label: item.name,
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

                <InputReadOnly
                  label={formText.fields.equipmentType}
                  value={formText.fields.equipmentTypeOwn}
                />

                <Controller
                  name={`items.${index}.equipment.vl_time_productive`}
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      name={field.name}
                      label={formText.fields.equipmentProductiveTime}
                      allowDot
                      decimalPlaces={2}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      error={rowErrors?.vl_time_productive?.message as string | undefined}
                      isRequired
                      disabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.hour_meter`}
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      name={field.name}
                      label={formText.fields.equipmentHourMeter}
                      min={0}
                      decimalPlaces={0}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      error={rowErrors?.hour_meter?.message as string | undefined}
                      disabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.year_mod`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      label={formText.fields.equipmentYearMod}
                      name={field.name}
                      maxLength={10}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={rowErrors?.year_mod?.message as string | undefined}
                      disabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.brand`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      label={formText.fields.equipmentBrand}
                      name={field.name}
                      maxLength={20}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={rowErrors?.brand?.message as string | undefined}
                      disabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.patrimony`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      label={formText.fields.equipmentPatrimony}
                      name={field.name}
                      maxLength={40}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={rowErrors?.patrimony?.message as string | undefined}
                      disabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.color`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      label={formText.fields.equipmentColor}
                      name={field.name}
                      maxLength={10}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={rowErrors?.color?.message as string | undefined}
                      disabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.model`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      label={formText.fields.equipmentModel}
                      name={field.name}
                      maxLength={30}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={rowErrors?.model?.message as string | undefined}
                      disabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.vl_acquisition`}
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      name={field.name}
                      label={formText.fields.equipmentAcquisitionValue}
                      allowDot
                      decimalPlaces={2}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      error={rowErrors?.vl_acquisition?.message as string | undefined}
                      isRequired
                      disabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.status`}
                  control={control}
                  render={({ field: { name, value, onChange } }) => (
                    <Select
                      label={formText.fields.equipmentStatus}
                      name={name}
                      value={
                        equipmentStatusOptions.find((option) => option.value === value?.value) ??
                        null
                      }
                      onChange={(option) => onChange(option ?? null)}
                      options={equipmentStatusOptions}
                      error={rowErrors?.status?.message as string | undefined}
                      isRequired
                      isDisabled={isDisabled}
                    />
                  )}
                />
              </SimpleGrid>
            </Tabs.Content>

            {/* ---- ABA 2: Fiscal/Veículo (TASK-FE-630) ---- */}
            {/* @ts-ignore */}
            <Tabs.Content value="1">
              <SimpleGrid columns={columnsForm.default} gap={4} pt={4}>
                <Controller
                  name={`items.${index}.equipment.chassi`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      label={formText.fields.equipmentChassi}
                      name={field.name}
                      maxLength={17}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={rowErrors?.chassi?.message as string | undefined}
                      disabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.renavam`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      label={formText.fields.equipmentRenavam}
                      name={field.name}
                      maxLength={11}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={rowErrors?.renavam?.message as string | undefined}
                      disabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.serie`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      label={formText.fields.equipmentSerie}
                      name={field.name}
                      maxLength={40}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={rowErrors?.serie?.message as string | undefined}
                      disabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.plate`}
                  control={control}
                  render={({ field }) => (
                    <MaskedInput
                      kind="plate"
                      label={formText.fields.equipmentPlate}
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={rowErrors?.plate?.message as string | undefined}
                      disabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.uf`}
                  control={control}
                  render={({ field: { name, value, onChange } }) => (
                    <Select
                      label={formText.fields.equipmentUf}
                      placeholder={formText.placeholders.equipmentUf}
                      name={name}
                      value={stateOptions.find((option) => option.value === value) ?? null}
                      onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                      options={stateOptions}
                      error={rowErrors?.uf?.message as string | undefined}
                      isDisabled={isDisabled}
                      loading={stateOptionsQuery.isLoading}
                    />
                  )}
                />
              </SimpleGrid>
            </Tabs.Content>

            {/* ---- ABA 3: Financeiro/Depreciação (TASK-FE-631) ---- */}
            {/* @ts-ignore */}
            <Tabs.Content value="2">
              <SimpleGrid columns={columnsForm.default} gap={4} pt={4}>
                <Controller
                  name={`items.${index}.equipment.has_depreciation`}
                  control={control}
                  render={({ field: { name, value, onChange } }) => (
                    <Select
                      label={formText.fields.equipmentHasDepreciation}
                      name={name}
                      value={
                        hasDepreciationOptions.find((option) => option.value === !!value) ?? null
                      }
                      onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                      options={hasDepreciationOptions}
                      noClearable
                      isDisabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.depreciation_type`}
                  control={control}
                  render={({ field: { name, value, onChange } }) => (
                    <Select
                      label={formText.fields.equipmentDepreciationType}
                      name={name}
                      value={
                        depreciationTypeOptions.find((option) => option.value === value) ?? null
                      }
                      onChange={(opt: Option<number> | null) =>
                        onChange(opt?.value ?? FamilyEquipmentDepreciationType.SEM_RESIDUAL)
                      }
                      options={depreciationTypeOptions}
                      noClearable
                      isDisabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.residual`}
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      name={field.name}
                      label={formText.fields.equipmentResidual}
                      min={0}
                      max={100}
                      allowDot
                      decimalPlaces={2}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      error={rowErrors?.residual?.message as string | undefined}
                      isRequired={isComResidual}
                      disabled={isDisabled}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.equipment.life_bens`}
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      name={field.name}
                      label={formText.fields.equipmentLifeBens}
                      min={0}
                      decimalPlaces={0}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      error={rowErrors?.life_bens?.message as string | undefined}
                      disabled={isDisabled}
                    />
                  )}
                />

                {/* Preview client-side (RN-2), nunca enviado no payload
                        — GAP-BE-623 confirma que o servidor sempre
                        recalcula. */}
                <InputReadOnly
                  label={formText.fields.equipmentVlResidual}
                  value={formatCurrencyBRL(vlResidualPreview)}
                />

                <InputReadOnly
                  label={formText.fields.equipmentVlDepreciate}
                  value={formatCurrencyBRL(vlDepreciatePreview)}
                />

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    {formText.fields.equipmentDtAcquisition}
                  </Text>
                  <Controller
                    name={`items.${index}.equipment.dt_acquisition`}
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <DateInput value={value ?? null} onChange={onChange} disabled={isDisabled} />
                    )}
                  />
                </Box>
              </SimpleGrid>

              <SimpleGrid columns={columnsForm.default} gap={4} mt={4}>
                <Controller
                  name={`items.${index}.equipment.specification`}
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      label={formText.fields.equipmentSpecification}
                      name={field.name}
                      maxLength={200}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={rowErrors?.specification?.message as string | undefined}
                      disabled={isDisabled}
                    />
                  )}
                />
              </SimpleGrid>
            </Tabs.Content>
          </Tabs.Root>
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
