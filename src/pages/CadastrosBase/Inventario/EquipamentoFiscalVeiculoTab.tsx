// src/pages/CadastrosBase/Inventario/EquipamentoFiscalVeiculoTab.tsx
// -----------------------------------------------------------------------------
// Aba "Fiscal/Veículo" do formulário de Inventário (Equipment) — TASK-FE-1007
// (execução 026). Arquivo PRÓPRIO, contribui campos ao MESMO `useForm` raiz de
// `CreateOrUpdateEquipamento.tsx` (`TASK-FE-1005`, âncora), sem criar `useForm`
// local — mesmo mecanismo de paralelismo já usado em `Products`/
// `ProdutoFiscalTab.tsx` (mirror MECÂNICO do gate `is_fiscal`/`ProdutoFiscalTab`,
// adaptado ao catálogo de campos PRÓPRIO do legado de veículo, não fiscal de
// produto).
//
// Contrato consumido: Equipment-Frontend-Contrato.md §6 (tabela "Aba
// Fiscal/Veículo") + §10 (catálogos estáticos, `/states/options`) + Doc Bruta
// §2/§7 (achado central — zero validação server-side neste bloco no legado).
//
// -- Gate `use_fiscal` (mecânica) --------------------------------------------
// Bloco inteiro OCULTO (não só desabilitado) quando `use_fiscal=false` — mesma
// decisão de UX já usada em `ProdutoFiscalTab.tsx`. Precedente OBRIGATÓRIO da
// execução 025 (`TASK-FE-991`/`GAP-FE-190`, Opção A): ocultar sozinho não
// basta — o `onChange` do gate também ZERA os 18 campos do bloco (todos os
// campos do bloco fiscal EXCETO `brand`, que fica FORA do gate, sempre
// visível/editável, fiel ao legado — Doc Bruta linha 93/Equipment-Frontend-
// Contrato.md §6). `null` para toda coluna nullable (nenhum campo aqui é
// NOT NULL — diferente de `modality_bc`/`percent_reduction` em Products).
//
// -- Obrigatoriedade condicional (`use_fiscal`) -------------------------------
// UT-000688: com `use_fiscal=true` são obrigatórios `plate` e `type`,
// `body_type`, `wheel_type`, `tara`, `capacity`, `owner_type`,
// `owner_document`, `owner_name`, `owner_ie`, `owner_uf`, `owner_tp` (espelha
// `EquipmentRequest` da API; regra no Yup, `equipment-schema.ts`); `uf` e
// `rntrc` seguem opcionais.
//
// -- `owner_document` (CPF/CNPJ, máscara dinâmica) ---------------------------
// `Controller` do RHF (NUNCA `register` cru — armadilha recorrente do
// projeto com campos mascarados). A máscara é dirigida por `owner_type`
// ('f'=CPF/'j'=CNPJ, Select irmão nesta MESMA aba), não pela contagem de
// dígitos do próprio campo (diferente de `nif`/`cpf_cnpj` do Emissor/Pessoas,
// que INFEREM o tipo pelo valor digitado). Reaproveita
// `cpfCnpjBeforeMaskedStateChange` (`@/utils/cpfCnpj`, agnóstico de campo —
// só olha `currentState`/`nextState`) para o mesmo resgate de transição de
// máscara já corrigido em `Pessoas`/`Emissor` (TASK-FE-333/TASK-FE-322),
// cobrindo o instante em que o usuário digita/edita o documento no MESMO
// render em que `owner_type` acabou de mudar.
//
// -- `plate` (UT-000787, D4) ---------------------------------------------------
// Com "Usa Dados Fiscais" ativo, `plate` usa `MaskedInput kind="plate"`
// (antiga ABC-1234 e Mercosul ABC-1D99, valor com hífen) e o schema aplica
// `isValidPlate`; sem fiscal permanece `Input` livre (max 10). `chassi` segue `Input` simples com
// `maxLength=17` (VIN alfanumérico sem agrupamento; sem mask lib).
//
// -- `rntrc` (hardening já fechado pelo schema) -------------------------------
// `maxLength=12` (coluna real — TASK-FE-1003 já endureceu o mismatch do blade
// legado, que usa 14). Doc Bruta linha 94 menciona um filtro JS `oninput` só
// de dígitos no legado — client-only, sem contrapartida no schema/contrato;
// NÃO replicado aqui (schema só valida `.max(12)`) para evitar inventar
// comportamento não especificado sobre um `register()` simples.
//
// -- Catálogos estáticos (`type`/`body_type`/`wheel_type`/`owner_tp`) --------
// Fábricas `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (`@/constants/cadastrosBase/equipment/equipment-fiscal-catalogs.ts`, mirror
// `markerTypeOptions`) — códigos fixos 1:1 de `Equipment::opTypes()`/
// `opBodyTypes()`/`opWheelTypes()`/`opOwnerTypes()` (agro365
// `app/Equipment.php` linhas 168-248), SEM endpoint (mesma estratégia já
// usada em `TaxRules`).
//
// -- `uf`/`owner_uf` (Select BULK, não `SelectAsyncPaginate`) ----------------
// `EquipmentForm.uf`/`owner_uf` guardam o CÓDIGO CRU (`string`), não
// `Option<string>` (convenção documentada no cabeçalho de
// `@/@types/v2/Equipments`) — mirror do bulk fetch (1x) já usado para
// `family_equipment_uuid` em `CreateOrUpdateEquipamento.tsx`
// (`familyOptionsQuery`), adaptado para `listStateOptions` (`/states/options`,
// JÁ EXISTE, `@/services/v2/States/state-service.ts`) — ~27 UFs cabem
// inteiras numa página (`per_page` alto), dispensando paginação incremental.
// -----------------------------------------------------------------------------

import { Box, Heading, SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useWatch } from 'react-hook-form';

import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';

import { useLanguage } from '@/hooks/useLanguage';

import {
  equipmentBodyTypeOptions,
  equipmentOwnerTpOptions,
  equipmentVehicleTypeOptions,
  equipmentWheelTypeOptions,
} from '@/constants/cadastrosBase/equipment/equipment-fiscal-catalogs';
import { columnsForm } from '@/constants/coluns-form';
import { BRAZIL_COUNTRY_CODE } from '@/constants/countries';

import { listStateOptions } from '@/services/v2/States/state-service';

import type { Option } from '@/@types/option';
import type { EquipmentData, EquipmentForm } from '@/@types/v2/Equipments';
import type { StateOption } from '@/@types/v2/States';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface EquipamentoFiscalVeiculoTabProps {
  control: Control<EquipmentForm>;
  errors: FieldErrors<EquipmentForm>;
  watch: UseFormWatch<EquipmentForm>;
  setValue: UseFormSetValue<EquipmentForm>;
  isLoading: boolean;
  canSave: boolean;
  isEditing: boolean;
  equipmentData?: EquipmentData;
}

/** Os 18 campos do bloco Fiscal ZERADOS quando `use_fiscal` vira `false`
 *  (mirror `FISCAL_FIELDS_CLEAR_MAP`/`clearFiscalFields` de
 *  `ProdutoFiscalTab.tsx`, TASK-FE-991/`GAP-FE-190` Opção A — precedente
 *  OBRIGATÓRIO desta Tarefa). `brand` EXCLUÍDO de propósito (fora do gate,
 *  sempre visível/editável, fiel ao legado). `null` para toda coluna
 *  nullable — nenhuma exceção NOT NULL neste bloco (diferente de
 *  `modality_bc`/`percent_reduction` em Products). */
const EQUIPMENT_FISCAL_FIELDS_CLEAR_MAP: [keyof EquipmentForm, unknown][] = [
  ['chassi', null],
  ['renavam', null],
  ['serie', null],
  ['plate', null],
  ['color', null],
  ['uf', null],
  ['rntrc', null],
  ['type', null],
  ['body_type', null],
  ['wheel_type', null],
  ['tara', null],
  ['capacity', null],
  ['owner_type', null],
  ['owner_document', null],
  ['owner_name', null],
  ['owner_ie', null],
  ['owner_uf', null],
  ['owner_tp', null],
];

/**
 * Aplica `EQUIPMENT_FISCAL_FIELDS_CLEAR_MAP` via `setValue` do form-pai —
 * `{ shouldDirty: true }` garante que o guard `onSubmit`
 * (`!isEmpty(dirtyFields)`, `utils/isEmpty` INVERTIDO — `true` quando HÁ
 * chaves) reconheça a limpeza como edição real.
 * @param {UseFormSetValue<EquipmentForm>} setValue - `setValue` do form-pai.
 */
function clearEquipmentFiscalFields(setValue: UseFormSetValue<EquipmentForm>) {
  EQUIPMENT_FISCAL_FIELDS_CLEAR_MAP.forEach(([fieldName, clearedValue]) => {
    setValue(fieldName, clearedValue as never, { shouldDirty: true });
  });
}

// TASK-FE-1007 (execução 026, AJUSTE 2 do E2E do dev) — o legado filtra
// UF por país explicitamente (`agro365/app/Http/Controllers/Admin/
// EquipmentController.php:119`/`:260` → `State::where('country_id', 30)`,
// 30 = Brasil no legado). A API nova identifica país pelo `countries.codigo`
// (código IBGE, ESTÁVEL entre ambientes — ao contrário de uuid/id, que
// variam por seed). Fonte única: `BRAZIL_COUNTRY_CODE` em
// `@/constants/countries` (TASK-072-FE-01) — NUNCA espalhar o literal.

async function fetchEquipmentFormStateOptions(): Promise<StateOption[]> {
  // `country_code` CONFIRMADO no ar em `StateOptionsRequest` (ver comentário
  // de `listStateOptions`, `state-service.ts`) — o endpoint agora devolve só
  // as UFs do Brasil (27), não mais as 63 (Brasil+Angola+Paraguai).
  const response = await listStateOptions({
    per_page: 100,
    country_code: String(BRAZIL_COUNTRY_CODE),
  });
  return response.data.items;
}

export function EquipamentoFiscalVeiculoTab({
  control,
  setValue,
  isLoading,
  canSave,
}: EquipamentoFiscalVeiculoTabProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.equipments.equipment;
  const formText = text.form;

  // Leitura reativa do gate — `useWatch` (não `watch`, para não obrigar mais
  // um prop já recebido só por isto, mirror `ProdutoFiscalTab.tsx`).
  const useFiscalValue = useWatch({ control, name: 'use_fiscal' });

  const isDisabled = !canSave || isLoading;

  // Bulk fetch (1x) de UF — `Select` bulk, NÃO `SelectAsyncPaginate`
  // (`EquipmentForm.uf`/`owner_uf` guardam o código CRU, não `Option`; ver
  // cabeçalho do arquivo). Mirror `familyOptionsQuery`
  // (`CreateOrUpdateEquipamento.tsx`).
  const stateOptionsQuery = useQuery({
    queryKey: ['equipments-form-state-options'],
    queryFn: fetchEquipmentFormStateOptions,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const stateOptions: Option<string>[] = (stateOptionsQuery.data ?? []).map((item) => ({
    label: `${item.title} (${item.letter})`,
    value: item.letter,
  }));

  const useFiscalOptions: Option<boolean>[] = [
    { value: true, label: formText.fields.useFiscalYes },
    { value: false, label: formText.fields.useFiscalNo },
  ];

  const ownerTypeOptions: Option<'f' | 'j'>[] = [
    { value: 'f', label: formText.fields.ownerTypePhysical },
    { value: 'j', label: formText.fields.ownerTypeLegal },
  ];

  const vehicleTypeOptions = equipmentVehicleTypeOptions.options(languageGB);
  const bodyTypeOptions = equipmentBodyTypeOptions.options(languageGB);
  const wheelTypeOptions = equipmentWheelTypeOptions.options(languageGB);
  const ownerTpOptions = equipmentOwnerTpOptions.options(languageGB);

  return (
    <Box pt={4}>
      <SimpleGrid columns={columnsForm.default} gap={6} mb={6}>
        {/* `use_fiscal` — gate de exibição do bloco abaixo. Select Sim/Não
            (NUNCA Switch), não-clareável, default `true` (mesmo default do
            schema/legado). */}
        <Controller
          name="use_fiscal"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={formText.fields.useFiscal}
              name={name}
              value={useFiscalOptions.find((option) => option.value === value) ?? null}
              onChange={(opt: Option<boolean> | null) => {
                const newUseFiscalValue = !!opt?.value;
                onChange(newUseFiscalValue);
                // Precedente OBRIGATÓRIO TASK-FE-991/GAP-FE-190 (Opção A) —
                // ocultar E zerar ao desmarcar, sem confirmação. Remarcar não
                // restaura nada (mesmo comportamento aceito em Products).
                if (!newUseFiscalValue) {
                  clearEquipmentFiscalFields(setValue);
                }
              }}
              options={useFiscalOptions}
              isDisabled={isDisabled}
              loading={isLoading}
              noClearable
            />
          )}
        />

        {/* `brand` — FORA do gate `use_fiscal`, sempre visível/editável,
            fiel ao legado (Doc Bruta linha 93/contrato §6). `Controller`
            (não `register` — esta aba NÃO recebe `register` do form-pai,
            só `control`/`errors`/`watch`/`setValue`, mirror `year_mod` de
            `EquipamentoFinanceiroDepreciacaoTab.tsx`). */}
        <Controller
          name="brand"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              label={formText.fields.brand}
              name={field.name}
              maxLength={20}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              error={fieldState.error?.message}
              loading={isLoading}
              disabled={!canSave}
            />
          )}
        />
      </SimpleGrid>

      {useFiscalValue && (
        <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={6} mb={6}>
          <Heading size="sm" fontWeight="600" mb={4}>
            {formText.tabs.fiscalVehicle}
          </Heading>

          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="chassi"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label={formText.fields.chassi}
                  name={field.name}
                  maxLength={17}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={fieldState.error?.message}
                  loading={isLoading}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="renavam"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label={formText.fields.renavam}
                  name={field.name}
                  maxLength={11}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={fieldState.error?.message}
                  loading={isLoading}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="serie"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label={formText.fields.serie}
                  name={field.name}
                  maxLength={40}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={fieldState.error?.message}
                  loading={isLoading}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="plate"
              control={control}
              render={({ field, fieldState }) =>
                useFiscalValue ? (
                  <MaskedInput
                    kind="plate"
                    label={formText.fields.plate}
                    name={field.name}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    isRequired={!!useFiscalValue}
                    loading={isLoading}
                    disabled={isDisabled}
                  />
                ) : (
                  <Input
                    label={formText.fields.plate}
                    name={field.name}
                    maxLength={10}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={fieldState.error?.message}
                    loading={isLoading}
                    disabled={isDisabled}
                  />
                )
              }
            />

            <Controller
              name="color"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label={formText.fields.color}
                  name={field.name}
                  maxLength={10}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={fieldState.error?.message}
                  loading={isLoading}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="uf"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={formText.fields.uf}
                  name={name}
                  placeholder={formText.placeholders.uf}
                  value={stateOptions.find((option) => option.value === value) ?? null}
                  onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                  options={stateOptions}
                  error={error?.message}
                  isDisabled={isDisabled}
                  loading={isLoading || stateOptionsQuery.isLoading}
                />
              )}
            />

            <Controller
              name="rntrc"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label={formText.fields.rntrc}
                  name={field.name}
                  maxLength={12}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={fieldState.error?.message}
                  loading={isLoading}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="type"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={formText.fields.type}
                  name={name}
                  value={vehicleTypeOptions.find((option) => option.value === value) ?? null}
                  onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                  options={vehicleTypeOptions}
                  error={error?.message}
                  isRequired={!!useFiscalValue}
                  isDisabled={isDisabled}
                  loading={isLoading}
                />
              )}
            />

            <Controller
              name="body_type"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={formText.fields.bodyType}
                  name={name}
                  value={bodyTypeOptions.find((option) => option.value === value) ?? null}
                  onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                  options={bodyTypeOptions}
                  error={error?.message}
                  isRequired={!!useFiscalValue}
                  isDisabled={isDisabled}
                  loading={isLoading}
                />
              )}
            />

            <Controller
              name="wheel_type"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={formText.fields.wheelType}
                  name={name}
                  value={wheelTypeOptions.find((option) => option.value === value) ?? null}
                  onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                  options={wheelTypeOptions}
                  error={error?.message}
                  isRequired={!!useFiscalValue}
                  isDisabled={isDisabled}
                  loading={isLoading}
                />
              )}
            />

            <Controller
              name="tara"
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  name={field.name}
                  label={formText.fields.tara}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  min={0}
                  allowDot
                  decimalPlaces={2}
                  error={fieldState.error?.message}
                  isRequired={!!useFiscalValue}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="capacity"
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  name={field.name}
                  label={formText.fields.capacity}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  min={0}
                  allowDot
                  decimalPlaces={2}
                  error={fieldState.error?.message}
                  isRequired={!!useFiscalValue}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="owner_type"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={formText.fields.ownerType}
                  name={name}
                  value={ownerTypeOptions.find((option) => option.value === value) ?? null}
                  onChange={(opt: Option<'f' | 'j'> | null) => onChange(opt?.value ?? null)}
                  options={ownerTypeOptions}
                  error={error?.message}
                  isRequired={!!useFiscalValue}
                  isDisabled={isDisabled}
                  loading={isLoading}
                />
              )}
            />

            {/* `owner_document` — CPF/CNPJ, `Controller` (NUNCA `register`
                cru). `MaskedInput kind="cpfCnpj"` resolve CPF↔CNPJ
                internamente pela quantidade de dígitos digitados —
                substitui a máscara antes dirigida por `owner_type` +
                `cpfCnpjBeforeMaskedStateChange`, sem bug de comprimento
                fixo (esteira 001, Wave 3). */}
            <Controller
              name="owner_document"
              control={control}
              render={({ field, fieldState }) => (
                <MaskedInput
                  kind="cpfCnpj"
                  label={formText.fields.ownerDocument}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  isRequired={!!useFiscalValue}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="owner_name"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label={formText.fields.ownerName}
                  name={field.name}
                  maxLength={100}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={fieldState.error?.message}
                  isRequired={!!useFiscalValue}
                  loading={isLoading}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="owner_ie"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label={formText.fields.ownerIe}
                  name={field.name}
                  maxLength={12}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={fieldState.error?.message}
                  isRequired={!!useFiscalValue}
                  loading={isLoading}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="owner_uf"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={formText.fields.ownerUf}
                  name={name}
                  placeholder={formText.placeholders.ownerUf}
                  value={stateOptions.find((option) => option.value === value) ?? null}
                  onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                  options={stateOptions}
                  error={error?.message}
                  isRequired={!!useFiscalValue}
                  isDisabled={isDisabled}
                  loading={isLoading || stateOptionsQuery.isLoading}
                />
              )}
            />

            <Controller
              name="owner_tp"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={formText.fields.ownerTp}
                  name={name}
                  value={ownerTpOptions.find((option) => option.value === value) ?? null}
                  onChange={(opt: Option<number> | null) => onChange(opt?.value ?? null)}
                  options={ownerTpOptions}
                  error={error?.message}
                  isRequired={!!useFiscalValue}
                  isDisabled={isDisabled}
                  loading={isLoading}
                />
              )}
            />
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
}
