// src/pages/Fiscal/Mdfe/MdfeTabTransporte.tsx
// -----------------------------------------------------------------------------
// Aba 1 "Transporte" do formulário de MDFe — TASK-MDFE-FE-04
// (`CONTRATO-FRONT-MDFE.md §5.2/§5.3/§5.4`). Recebe `control`/`register`/
// `errors`/`watch`/`setValue` do ÚNICO `useForm` raiz montado em
// `CreateOrUpdateMdfe.tsx` (TASK-MDFE-FE-03) — NÃO instancia `useForm`
// próprio.
//
// Cascata veículo de tração → reboque obrigatório (`IG020`/`IG021`): fetch
// PONTUAL de atributo (`GET /equipments/{uuid}`, NÃO uma lista de opções),
// recalculado do zero a cada troca de `veiculo_tracao_id` (chave de
// `useQuery` = uuid selecionado — cache naturalmente por veículo, nunca
// herda o resultado anterior).
//
// 3 subcoleções em padrão STAGING (mirror `ChavesNfeFieldArray.tsx`):
// CIOTs/Vale-pedágio removem TODAS as linhas com o mesmo valor (dedupe);
// Pagamentos remove por ÍNDICE — único caso do módulo (`IG011`, preservar).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import {
  Control,
  Controller,
  FieldErrors,
  useFieldArray,
  useFormState,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { onlyDigits } from '@/utils/cpfCnpj';

import { columnsForm } from '@/constants/coluns-form';
import {
  mdfePaymentComponentOptions,
  mdfePaymentTypeOptions,
} from '@/constants/Fiscal/mdfe-payment-options';

import { MDFE_CIOT_CODE_PATTERN } from '@/validations/schemas/Mdfe/mdfe-schema';

import { listBankOptions } from '@/services/v2/Banks/bank-service';
import {
  getEquipment,
  listEquipmentCatalogOptions,
} from '@/services/v2/Equipments/equipment-service';

import type { Option } from '@/@types/option';
import type { EquipmentOption } from '@/@types/v2/Equipments';
import type { MdfeForm, MdfePaymentComponentType, MdfePaymentType } from '@/@types/v2/Fiscal/Mdfe';

// GAP-FE-245/EXECUÇÃO — `veiculo_tracao_id`/`veiculo_reboque_id`/`_2`/`_3`
// são uuid validados por `exists:equipments,uuid` (`MdfeRequest::rules()`,
// SEM filtro `fiscal`, distinto de `CteRequest`/`getEquipmentsOptions` do
// CTe, que restringe a `use_fiscal=1` — reaproveitar o wrapper do CTe aqui
// introduziria uma restrição que o backend do MDFe não exige). `/equipments/
// options` pagina de verdade — `SelectAsyncPaginate` + `listEquipmentCatalog
// Options` (mesmo endpoint, busca por texto, paginado) substitui o Select
// estático `per_page:100` que deixava veículos fora dos 100 primeiros
// inacessíveis, mirror do padrão assíncrono de `CreateOrUpdateCte.tsx`.
function mapEquipmentOption(item: EquipmentOption): Option<string> {
  return { value: item.uuid, label: `${item.code} — ${item.description}` };
}

// Catálogos pequenos LK004/LK005 — exportados para que a casca
// (`CreateOrUpdateMdfe.tsx`) reidrate com o MESMO rótulo em edição.
export function mdfeTpEmitOptions(
  languageGB: ReturnType<typeof useLanguage>['languageGB']
): Option<number>[] {
  const text = languageGB.mdfes.mdfe.tpEmit;
  return [
    { value: 1, label: text.prestadorServico },
    { value: 2, label: text.transportadorProprio },
  ];
}

export function mdfeTpTranspOptions(
  languageGB: ReturnType<typeof useLanguage>['languageGB']
): Option<number>[] {
  const text = languageGB.mdfes.mdfe.tpTransp;
  return [
    { value: 1, label: text.etc },
    { value: 2, label: text.tac },
    { value: 3, label: text.ctc },
  ];
}

export interface MdfeTabTransporteProps {
  control: Control<MdfeForm>;
  register: UseFormRegister<MdfeForm>;
  errors: FieldErrors<MdfeForm>;
  watch: UseFormWatch<MdfeForm>;
  setValue?: UseFormSetValue<MdfeForm>;
  disabled?: boolean;
}

export function MdfeTabTransporte({
  control,
  register,
  errors,
  watch,
  disabled = false,
}: MdfeTabTransporteProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.mdfes.mdfe;
  const fields = text.form.fields;

  const tpEmitOptions = mdfeTpEmitOptions(languageGB);
  const tpTranspOptions = mdfeTpTranspOptions(languageGB);

  // ---- Cascata veiculo_tracao_id → wheel_type → veiculo_reboque_id
  // obrigatório (`CONTRATO-FRONT-MDFE.md §5.3`) --------------------------
  const veiculoTracaoOption = watch('veiculo_tracao_id');
  const veiculoTracaoUuid = veiculoTracaoOption?.value;

  const wheelTypeQuery = useQuery({
    queryKey: ['mdfe-vehicle-wheel-type', veiculoTracaoUuid],
    queryFn: async () => {
      const response = await getEquipment(veiculoTracaoUuid!);
      return response.data;
    },
    enabled: !!veiculoTracaoUuid,
  });

  const isReboqueRequired = !!veiculoTracaoUuid && wheelTypeQuery.data?.wheel_type === '03';

  return (
    <Box pt={4}>
      <SimpleGrid columns={columnsForm.default} gap={6}>
        <Controller
          name="veiculo_tracao_id"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={fields.veiculoTracao}
              service={listEquipmentCatalogOptions as any}
              pageSize={20}
              mapOptions={mapEquipmentOption as any}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              error={error?.message}
              isRequired
              isDisabled={disabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name="veiculo_reboque_id"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={fields.veiculoReboque}
              service={listEquipmentCatalogOptions as any}
              pageSize={20}
              mapOptions={mapEquipmentOption as any}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              error={error?.message}
              isRequired={isReboqueRequired}
              isDisabled={disabled || wheelTypeQuery.isFetching}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name="veiculo_reboque2_id"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={fields.veiculoReboque2}
              service={listEquipmentCatalogOptions as any}
              pageSize={20}
              mapOptions={mapEquipmentOption as any}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              isDisabled={disabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name="veiculo_reboque3_id"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={fields.veiculoReboque3}
              service={listEquipmentCatalogOptions as any}
              pageSize={20}
              mapOptions={mapEquipmentOption as any}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              isDisabled={disabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name="tp_emit"
          control={control}
          render={({ field }) => (
            <Select
              label={fields.tpEmit}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              options={tpEmitOptions}
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name="tp_transp"
          control={control}
          render={({ field }) => (
            <Select
              label={fields.tpTransp}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              options={tpTranspOptions}
              isDisabled={disabled}
            />
          )}
        />

        <Input
          label={fields.lacRodo}
          maxLength={30}
          {...register('lac_rodo')}
          error={errors.lac_rodo?.message}
          disabled={disabled}
        />
      </SimpleGrid>

      <Box mt={6}>
        <CiotFieldArray control={control} disabled={disabled} />
      </Box>

      <Box mt={6}>
        <ValePedagioFieldArray control={control} disabled={disabled} />
      </Box>

      <Box mt={6}>
        <PaymentFieldArray control={control} disabled={disabled} />
      </Box>
    </Box>
  );
}

interface FieldArrayBaseProps {
  control: Control<MdfeForm>;
  disabled?: boolean;
}

// -----------------------------------------------------------------------------
// CIOTs (`SURF-CIOT`, FD033/FD034, AC017/AC018, IG006/IG007) — staging:
// `codigo` (texto) + `cpf_cnpj` (máscara dinâmica); adicionar se AMBOS
// truthy — senão mensagem de staging; remover TODAS com o mesmo `codigo`.
// -----------------------------------------------------------------------------

export function CiotFieldArray({ control, disabled = false }: FieldArrayBaseProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.mdfes.mdfe.ciot;

  const { fields, append, remove } = useFieldArray({ control, name: 'ciots' });
  // Erro do array (CIOT obrigatório com tp_emit 1/3 ou 422 `ciots` da API) — mostrado acima da lista.
  const { errors: formErrors } = useFormState({ control, name: 'ciots' });
  const ciotsError = formErrors.ciots as
    { message?: string; root?: { message?: string } } | undefined;
  const arrayErrorMessage = ciotsError?.message ?? ciotsError?.root?.message;
  const [codigo, setCodigo] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [inlineError, setInlineError] = useState<string | undefined>();

  function handleAdd() {
    if (!codigo.trim() || !cpfCnpj.trim()) {
      setInlineError(text.stagingMessage);
      return;
    }
    // T-776-FE-03: CIOT tem exatamente 12 dígitos (mesma regra do `MdfeRequest`).
    if (!MDFE_CIOT_CODE_PATTERN.test(codigo.trim())) {
      setInlineError(text.codeLengthError);
      return;
    }
    const duplicateIndexes = fields
      .map((field, index) => ({ index, value: (field as any).codigo }))
      .filter((entry) => entry.value === codigo.trim())
      .map((entry) => entry.index);
    if (duplicateIndexes.length > 0) remove(duplicateIndexes);

    append({ codigo: codigo.trim(), cpf_cnpj: cpfCnpj });
    setCodigo('');
    setCpfCnpj('');
    setInlineError(undefined);
  }

  function handleRemove(codigoValue: string) {
    const indexes = fields
      .map((field, index) => ({ index, value: (field as any).codigo }))
      .filter((entry) => entry.value === codigoValue)
      .map((entry) => entry.index);
    if (indexes.length > 0) remove(indexes);
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {text.sectionTitle}
      </Text>

      {arrayErrorMessage && (
        <Text role="alert" fontSize="sm" color="fg.error" mb={2}>
          {arrayErrorMessage}
        </Text>
      )}

      {fields.length === 0 ? (
        <Text fontSize="sm" color="fg.muted" mb={4}>
          {text.emptyText}
        </Text>
      ) : (
        <Flex direction="column" gap={2} mb={4}>
          {fields.map((field) => {
            const row = field as any;
            return (
              <Flex key={field.id} align="center" gap={4}>
                <Box flex="1">
                  <Text fontSize="sm">
                    {row.codigo} — {row.cpf_cnpj}
                  </Text>
                </Box>
                <IconButtonTable
                  aria-label={text.removeButton}
                  mensegerTooltip={text.removeButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => handleRemove(row.codigo)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            );
          })}
        </Flex>
      )}

      {inlineError && (
        <Text fontSize="sm" color="fg.error" mb={2}>
          {inlineError}
        </Text>
      )}

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} alignItems="flex-end">
        <MaskedInput
          kind="digits"
          label={text.codigo}
          name="ciot-staging-codigo"
          maxLength={12}
          value={codigo}
          onChange={(event) => setCodigo(onlyDigits(event.target.value).slice(0, 12))}
          disabled={disabled}
        />
        <MaskedInput
          kind="cpfCnpj"
          label={text.cpfCnpj}
          name="ciot-staging-cpf-cnpj"
          value={cpfCnpj}
          onChange={(event) => setCpfCnpj(event.target.value)}
          disabled={disabled}
        />
        <Button
          type="button"
          title={text.addButton}
          icon={FiPlus as any}
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
        />
      </SimpleGrid>
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Vale-pedágio (`SURF-VALE-PEDAGIO`, FD035-FD038, AC019/AC020, IG008/IG009)
// — staging: `cnpj_fornecedor`/`cnpj_fornecedor_pagador` (máscara dinâmica),
// `numero_compra` (texto), `valor` (MoneyInput); adicionar se os 4 truthy;
// remover TODAS com o mesmo `numero_compra`.
// -----------------------------------------------------------------------------

function ValePedagioFieldArray({ control, disabled = false }: FieldArrayBaseProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.mdfes.mdfe.valePedagio;

  const { fields, append, remove } = useFieldArray({ control, name: 'vale_pedagios' });
  const [cnpjFornecedor, setCnpjFornecedor] = useState('');
  const [cnpjFornecedorPagador, setCnpjFornecedorPagador] = useState('');
  const [numeroCompra, setNumeroCompra] = useState('');
  const [valor, setValor] = useState<number | null>(null);
  const [inlineError, setInlineError] = useState<string | undefined>();

  function handleAdd() {
    if (!cnpjFornecedor.trim() || !cnpjFornecedorPagador.trim() || !numeroCompra.trim() || !valor) {
      setInlineError(text.stagingMessage);
      return;
    }
    const duplicateIndexes = fields
      .map((field, index) => ({ index, value: (field as any).numero_compra }))
      .filter((entry) => entry.value === numeroCompra.trim())
      .map((entry) => entry.index);
    if (duplicateIndexes.length > 0) remove(duplicateIndexes);

    append({
      cnpj_fornecedor: cnpjFornecedor,
      cnpj_fornecedor_pagador: cnpjFornecedorPagador,
      numero_compra: numeroCompra.trim(),
      valor,
    });
    setCnpjFornecedor('');
    setCnpjFornecedorPagador('');
    setNumeroCompra('');
    setValor(null);
    setInlineError(undefined);
  }

  function handleRemove(numeroCompraValue: string) {
    const indexes = fields
      .map((field, index) => ({ index, value: (field as any).numero_compra }))
      .filter((entry) => entry.value === numeroCompraValue)
      .map((entry) => entry.index);
    if (indexes.length > 0) remove(indexes);
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {text.sectionTitle}
      </Text>

      {fields.length === 0 ? (
        <Text fontSize="sm" color="fg.muted" mb={4}>
          {text.emptyText}
        </Text>
      ) : (
        <Flex direction="column" gap={2} mb={4}>
          {fields.map((field) => {
            const row = field as any;
            return (
              <Flex key={field.id} align="center" gap={4}>
                <Box flex="1">
                  <Text fontSize="sm">
                    {row.numero_compra} — {row.cnpj_fornecedor} → {row.cnpj_fornecedor_pagador} —{' '}
                    {row.valor}
                  </Text>
                </Box>
                <IconButtonTable
                  aria-label={text.removeButton}
                  mensegerTooltip={text.removeButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => handleRemove(row.numero_compra)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            );
          })}
        </Flex>
      )}

      {inlineError && (
        <Text fontSize="sm" color="fg.error" mb={2}>
          {inlineError}
        </Text>
      )}

      <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} alignItems="flex-end">
        <MaskedInput
          kind="cpfCnpj"
          label={text.cnpjFornecedor}
          name="vale-pedagio-staging-fornecedor"
          value={cnpjFornecedor}
          onChange={(event) => setCnpjFornecedor(event.target.value)}
          disabled={disabled}
        />
        <MaskedInput
          kind="cpfCnpj"
          label={text.cnpjFornecedorPagador}
          name="vale-pedagio-staging-pagador"
          value={cnpjFornecedorPagador}
          onChange={(event) => setCnpjFornecedorPagador(event.target.value)}
          disabled={disabled}
        />
        <Input
          label={text.numeroCompra}
          value={numeroCompra}
          onChange={(event) => setNumeroCompra(event.target.value)}
          disabled={disabled}
        />
        <MoneyInput
          name="vale-pedagio-staging-valor"
          label={text.valor}
          value={valor}
          onValueChange={setValor}
          disabled={disabled}
        />
      </SimpleGrid>
      <Box mt={4}>
        <Button
          type="button"
          title={text.addButton}
          icon={FiPlus as any}
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
        />
      </Box>
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Pagamentos (`SURF-PAYMENTS`, FD039-FD048, AC021/AC022, IG010/IG011) —
// staging com 10 campos; adicionar se nome+documento+valor truthy; remover
// por ÍNDICE (`splice`, ÚNICO caso do módulo que remove por índice — mirror
// `IG011`, preservar exatamente, nunca dedupe por valor aqui).
// -----------------------------------------------------------------------------

type PaymentFieldArrayProps = FieldArrayBaseProps;

function PaymentFieldArray({ control, disabled = false }: PaymentFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.mdfes.mdfe.payment;

  const { fields, append, remove } = useFieldArray({ control, name: 'payments' });

  const [responsibleName, setResponsibleName] = useState('');
  const [responsibleCpfCnpj, setResponsibleCpfCnpj] = useState('');
  const [paymentType, setPaymentType] = useState<Option<MdfePaymentType> | null>(
    mdfePaymentTypeOptions.options(languageGB)[0] ?? null
  );
  const [componentType, setComponentType] = useState<Option<MdfePaymentComponentType> | null>(
    mdfePaymentComponentOptions.options(languageGB)[0] ?? null
  );
  const [amount, setAmount] = useState<number | null>(null);
  const [bankCode, setBankCode] = useState<Option<string> | null>(null);
  const [agencyCode, setAgencyCode] = useState('');
  const [cnpjIpef, setCnpjIpef] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [inlineError, setInlineError] = useState<string | undefined>();

  const bankQuery = useQuery({
    queryKey: ['mdfe-payment-bank-options'],
    queryFn: () => listBankOptions({ page: 1, per_page: 100 }),
    staleTime: 5 * 60 * 1000,
  });
  // `bank_code` real é `varchar(3)` (código de compensação do banco, mirror
  // `contrato-mdfe-norm.md` FD044/schema legado) — NÃO uma FK uuid. O valor
  // enviado é `bank.code` (ex.: "341"), nunca `bank.uuid`.
  const bankOptions: Option<string>[] = (bankQuery.data?.data.items ?? []).map((bank) => ({
    label: `${bank.code} — ${bank.name}`,
    value: bank.code,
  }));

  function handleAdd() {
    if (!responsibleName.trim() || !responsibleCpfCnpj.trim() || !amount) {
      setInlineError(text.stagingMessage);
      return;
    }

    append({
      responsible_name: responsibleName.trim(),
      responsible_cpf_cnpj: responsibleCpfCnpj,
      payment_type: paymentType,
      component_type: componentType,
      amount,
      bank_code: bankCode,
      agency_code: agencyCode,
      cnpj_ipef: cnpjIpef,
      pix_key: pixKey,
      additional_info: additionalInfo,
    });

    setResponsibleName('');
    setResponsibleCpfCnpj('');
    setAmount(null);
    setBankCode(null);
    setAgencyCode('');
    setCnpjIpef('');
    setPixKey('');
    setAdditionalInfo('');
    setInlineError(undefined);
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {text.sectionTitle}
      </Text>

      {fields.length === 0 ? (
        <Text fontSize="sm" color="fg.muted" mb={4}>
          {text.emptyText}
        </Text>
      ) : (
        <Flex direction="column" gap={2} mb={4}>
          {fields.map((field, index) => {
            const row = field as any;
            return (
              <Flex key={field.id} align="center" gap={4}>
                <Box flex="1">
                  <Text fontSize="sm">
                    {row.responsible_name} — {row.responsible_cpf_cnpj} — {row.amount}
                  </Text>
                </Box>
                <IconButtonTable
                  aria-label={text.removeButton}
                  mensegerTooltip={text.removeButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={disabled}
                  // IG011 — remove por ÍNDICE (único caso do módulo).
                  onClick={() => remove(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            );
          })}
        </Flex>
      )}

      {inlineError && (
        <Text fontSize="sm" color="fg.error" mb={2}>
          {inlineError}
        </Text>
      )}

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <Input
          label={text.responsibleName}
          value={responsibleName}
          onChange={(event) => setResponsibleName(event.target.value)}
          disabled={disabled}
        />
        <MaskedInput
          kind="cpfCnpj"
          label={text.responsibleCpfCnpj}
          name="payment-staging-responsible-doc"
          value={responsibleCpfCnpj}
          onChange={(event) => setResponsibleCpfCnpj(event.target.value)}
          disabled={disabled}
        />
        <Select
          label={text.paymentType}
          name="payment-staging-type"
          value={paymentType}
          onChange={(option) => setPaymentType(option ?? null)}
          options={mdfePaymentTypeOptions.options(languageGB)}
          isDisabled={disabled}
        />
        <Select
          label={text.componentType}
          name="payment-staging-component"
          value={componentType}
          onChange={(option) => setComponentType(option ?? null)}
          options={mdfePaymentComponentOptions.options(languageGB)}
          isDisabled={disabled}
        />
        <MoneyInput
          name="payment-staging-amount"
          label={text.amount}
          value={amount}
          onValueChange={setAmount}
          disabled={disabled}
        />
        <Select
          label={text.bankCode}
          name="payment-staging-bank"
          value={bankCode}
          onChange={(option) => setBankCode(option ?? null)}
          options={bankOptions}
          loading={bankQuery.isLoading}
          isDisabled={disabled}
        />
        <Input
          label={text.agencyCode}
          value={agencyCode}
          maxLength={10}
          onInput={(event) => {
            const target = event.target as HTMLInputElement;
            target.value = onlyDigits(target.value);
          }}
          onChange={(event) => setAgencyCode(onlyDigits(event.target.value))}
          disabled={disabled}
        />
        <MaskedInput
          kind="cpfCnpj"
          label={text.cnpjIpef}
          name="payment-staging-ipef"
          value={cnpjIpef}
          onChange={(event) => setCnpjIpef(event.target.value)}
          disabled={disabled}
        />
        <Input
          label={text.pixKey}
          value={pixKey}
          onChange={(event) => setPixKey(event.target.value)}
          disabled={disabled}
        />
        <Box gridColumn={{ base: 'auto', md: 'span 3' }}>
          <Input
            label={text.additionalInfo}
            value={additionalInfo}
            onChange={(event) => setAdditionalInfo(event.target.value)}
            disabled={disabled}
          />
        </Box>
      </SimpleGrid>
      <Box mt={4}>
        <Button
          type="button"
          title={text.addButton}
          icon={FiPlus as any}
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
        />
      </Box>
    </Box>
  );
}

export default MdfeTabTransporte;
