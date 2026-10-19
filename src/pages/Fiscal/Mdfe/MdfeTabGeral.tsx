// src/pages/Fiscal/Mdfe/MdfeTabGeral.tsx
// -----------------------------------------------------------------------------
// Aba 0 "Geral" do formulário de MDFe — TASK-MDFE-FE-03
// (`CONTRATO-FRONT-MDFE.md §5.1/§5.2/§5.4`). Recebe `control`/`register`/
// `errors`/`watch`/`setValue` do ÚNICO `useForm` raiz montado em
// `CreateOrUpdateMdfe.tsx` (mirror `NfeItemsTab.tsx`/`MedidasFieldArray.tsx`
// — subcomponente fino, NUNCA instancia `useForm` próprio).
//
// Campos de cabeçalho `[DECISÃO-ARQUITETO]` (sem aba própria no doc-bruta,
// agrupados aqui por afinidade semântica) + 2 subcoleções `[DOC-BRUTA]`
// (Municípios de Carregamento / Percurso), ambas em padrão STAGING (input(s)
// de staging + botão "Adicionar" + lista de linhas já adicionadas com
// remover), mirror `ChavesNfeFieldArray.tsx` (execução 045, CTe) — dedupe
// por VALOR (`IG002`/`IG003`, `IG004`/`IG005`), nunca por índice.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldErrors,
  useFieldArray,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { InputMask } from '@/components/Form/InputMask';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { onlyDigits } from '@/utils/cpfCnpj';

import { ufOptions } from '@/constants/BaseRegistrations/options/uf-options';
import { columnsForm } from '@/constants/coluns-form';
import { mdfeTipoCargaOptions } from '@/constants/Fiscal/mdfe-tipo-carga-options';

import { listCityOptions } from '@/services/v2/Cities/city-service';

import type { Option } from '@/@types/option';
import type { CityListItem } from '@/@types/v2/Cities';
import type { MdfeForm, MdfeTypeEmission } from '@/@types/v2/Fiscal/Mdfe';

// GAP-FE-245 (Bug 2)/EXECUÇÃO — `cidade_id` é validado como uuid pelo
// backend (`MdfeRequest::rules()`, `exists:cities,uuid`); `/cities/options`
// pagina de verdade (>50 cidades) e o Select estático com `per_page:100`
// deixava cidades fora dos 100 primeiros inacessíveis (ex.: cidades de SP).
// `SelectAsyncPaginate` + `listCityOptions` (busca por texto, paginado)
// mirror do padrão assíncrono já usado em `CreateOrUpdateCte.tsx`.
function mapCityOption(item: CityListItem): Option<string> {
  return { value: item.uuid, label: item.title };
}

// Catálogos pequenos LK002/LK003 — exportados para que a casca
// (`CreateOrUpdateMdfe.tsx`) reidrate com o MESMO rótulo em edição, sem
// duplicar a lista de opções.
export function mdfeCargaPosteriorOptions(
  languageGB: ReturnType<typeof useLanguage>['languageGB']
): Option<boolean>[] {
  const text = languageGB.mdfes.mdfe.cargaPosteriorOptions;
  return [
    { value: true, label: text.yes },
    { value: false, label: text.no },
  ];
}

export function mdfeTypeEmissionOptions(
  languageGB: ReturnType<typeof useLanguage>['languageGB']
): Option<MdfeTypeEmission>[] {
  const text = languageGB.mdfes.mdfe.typeEmissionOptions;
  return [
    { value: 1, label: text.normal },
    { value: 2, label: text.contingencia },
  ];
}

export interface MdfeTabGeralProps {
  control: Control<MdfeForm>;
  register: UseFormRegister<MdfeForm>;
  errors: FieldErrors<MdfeForm>;
  watch: UseFormWatch<MdfeForm>;
  setValue?: UseFormSetValue<MdfeForm>;
  disabled?: boolean;
}

export function MdfeTabGeral({ control, register, errors, disabled = false }: MdfeTabGeralProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.mdfes.mdfe;
  const fields = text.form.fields;

  const cargaPosteriorOptions = mdfeCargaPosteriorOptions(languageGB);
  const typeEmissionOptions = mdfeTypeEmissionOptions(languageGB);

  return (
    <Box pt={4}>
      <SimpleGrid columns={columnsForm.default} gap={6}>
        <Controller
          name="uf_inicio"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Select
              label={fields.ufInicio}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              options={ufOptions}
              error={error?.message}
              isRequired
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name="uf_fim"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Select
              label={fields.ufFim}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              options={ufOptions}
              error={error?.message}
              isRequired
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name="data_inicio_viagem"
          control={control}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <Field
              label={fields.dataInicioViagem}
              isRequired
              errorText={error?.message}
              invalid={!!error}
            >
              <DateInput value={value ?? null} onChange={(v) => onChange(v ?? null)} />
            </Field>
          )}
        />

        <Controller
          name="carga_posterior"
          control={control}
          render={({ field }) => (
            <Select
              label={fields.cargaPosterior}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              options={cargaPosteriorOptions}
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name="type_emission"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Select
              label={fields.typeEmission}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              options={typeEmissionOptions}
              error={error?.message}
              isRequired
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name="cnpj_contratante"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <MaskedInput
              kind="cpfCnpj"
              label={fields.cnpjContratante}
              name={field.name}
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />

        <Controller
          name="quantidade_carga"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <NumberInput
              name={field.name}
              label={fields.quantidadeCarga}
              value={field.value}
              onValueChange={field.onChange}
              allowDot
              decimalPlaces={2}
              error={error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />

        <Controller
          name="valor_carga"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <MoneyInput
              name={field.name}
              label={fields.valorCarga}
              value={field.value}
              onValueChange={field.onChange}
              error={error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />

        <Input
          label={fields.produtoPredNome}
          maxLength={60}
          {...register('produto_pred_nome')}
          error={errors.produto_pred_nome?.message}
          disabled={disabled}
        />

        <Controller
          name="produto_pred_ncm"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Input
              label={fields.produtoPredNcm}
              maxLength={14}
              value={field.value ?? ''}
              onChange={(event) => field.onChange(onlyDigits(event.target.value))}
              onBlur={field.onBlur}
              error={error?.message}
              disabled={disabled}
            />
          )}
        />

        <Input
          label={fields.produtoPredCodBarras}
          maxLength={30}
          {...register('produto_pred_cod_barras')}
          error={errors.produto_pred_cod_barras?.message}
          disabled={disabled}
        />

        <Controller
          name="cep_carrega"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <InputMask
              label={fields.cepCarrega}
              name={field.name}
              mask="99999-999"
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={error?.message}
              disabled={disabled}
            />
          )}
        />

        <Controller
          name="cep_descarrega"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <InputMask
              label={fields.cepDescarrega}
              name={field.name}
              mask="99999-999"
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={error?.message}
              disabled={disabled}
            />
          )}
        />

        <Input
          label={fields.latitudeCarregamento}
          maxLength={20}
          {...register('latitude_carregamento')}
          error={errors.latitude_carregamento?.message}
          disabled={disabled}
        />

        <Input
          label={fields.longitudeCarregamento}
          maxLength={20}
          {...register('longitude_carregamento')}
          error={errors.longitude_carregamento?.message}
          disabled={disabled}
        />

        <Input
          label={fields.latitudeDescarregamento}
          maxLength={20}
          {...register('latitude_descarregamento')}
          error={errors.latitude_descarregamento?.message}
          disabled={disabled}
        />

        <Input
          label={fields.longitudeDescarregamento}
          maxLength={20}
          {...register('longitude_descarregamento')}
          error={errors.longitude_descarregamento?.message}
          disabled={disabled}
        />

        <Controller
          name="tp_carga"
          control={control}
          render={({ field }) => (
            <Select
              label={fields.tpCarga}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              options={mdfeTipoCargaOptions.options(languageGB)}
              isDisabled={disabled}
            />
          )}
        />

        <Input
          label={fields.seguradoraNome}
          maxLength={60}
          {...register('seguradora_nome')}
          error={errors.seguradora_nome?.message}
          disabled={disabled}
        />

        <Controller
          name="seguradora_cnpj"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <MaskedInput
              kind="cnpj"
              label={fields.seguradoraCnpj}
              name={field.name}
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={error?.message}
              disabled={disabled}
            />
          )}
        />

        <Input
          label={fields.numeroApolice}
          maxLength={30}
          {...register('numero_apolice')}
          error={errors.numero_apolice?.message}
          disabled={disabled}
        />

        <Input
          label={fields.numeroAverbacao}
          maxLength={30}
          {...register('numero_averbacao')}
          error={errors.numero_averbacao?.message}
          disabled={disabled}
        />

        <Controller
          name="info_complementar"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <InputMask
              label={fields.infoComplementar}
              name={field.name}
              mask="99999-999"
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={error?.message}
              disabled={disabled}
            />
          )}
        />

        <Controller
          name="info_adicional_fisco"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <InputMask
              label={fields.infoAdicionalFisco}
              name={field.name}
              mask="99999-999"
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={error?.message}
              disabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      <Box mt={6}>
        <MunicipiosCarregamentoFieldArray control={control} disabled={disabled} />
      </Box>

      <Box mt={6}>
        <PercursoFieldArray control={control} disabled={disabled} />
      </Box>
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Municípios de Carregamento (`SURF-MUNICIPIOS-CARGA`, FD031, AC013/AC014,
// IG002/IG003) — staging: `cidade_id` (Select, `listCityOptions`); adicionar
// se truthy; remover TODAS as linhas com o mesmo `cidade_id` (dedupe por
// valor, mirror `ChavesNfeFieldArray.tsx`).
// -----------------------------------------------------------------------------

interface FieldArrayBaseProps {
  control: Control<MdfeForm>;
  disabled?: boolean;
}

function MunicipiosCarregamentoFieldArray({ control, disabled = false }: FieldArrayBaseProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.mdfes.mdfe.municipiosCarregamento;

  const { fields, append, remove } = useFieldArray({ control, name: 'municipios_carregamento' });
  const [staging, setStaging] = useState<Option<string> | null>(null);

  function handleAdd() {
    if (!staging?.value) return;
    // IG002/IG003 — remove todas as linhas com o mesmo valor antes de
    // adicionar de novo (dedupe, nunca duplicata do mesmo município).
    const duplicateIndexes = fields
      .map((field, index) => ({ index, value: (field as any).cidade_id?.value }))
      .filter((entry) => entry.value === staging.value)
      .map((entry) => entry.index);
    if (duplicateIndexes.length > 0) remove(duplicateIndexes);
    append({ cidade_id: staging });
    setStaging(null);
  }

  function handleRemove(cidadeId: string | undefined) {
    const indexes = fields
      .map((field, index) => ({ index, value: (field as any).cidade_id?.value }))
      .filter((entry) => entry.value === cidadeId)
      .map((entry) => entry.index);
    if (indexes.length > 0) remove(indexes);
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      {/* CORREÇÃO ADICIONAL (retest do dono, lote-2) — o dono pediu
          explicitamente: "Se precisa de todos os campos preenchidos, marque-
          os com * para visualização". Esta seção é STAGING (adicionar item à
          lista) e participa do gate de Salvar (`canSaveGate` em
          `CreateOrUpdateMdfe.tsx`, exige `length >= 1`), mas não tinha
          NENHUMA indicação visual de obrigatoriedade — asterisco vermelho no
          título, mirror `ChakraField.RequiredIndicator` (`Field.tsx`). */}
      <Flex align="center" mb={4} gap="1">
        <Text fontSize="sm" fontWeight="semibold">
          {text.sectionTitle}
        </Text>
        <Text fontSize="sm" fontWeight="semibold" color="feedBack.errorMain">
          *
        </Text>
      </Flex>

      {fields.length === 0 ? (
        <Text fontSize="sm" color="fg.muted" mb={4}>
          {text.emptyText}
        </Text>
      ) : (
        <Flex direction="column" gap={2} mb={4}>
          {fields.map((field) => {
            const cidade = (field as any).cidade_id as Option<string> | null;
            return (
              <Flex key={field.id} align="center" gap={4}>
                <Box flex="1">
                  <Text fontSize="sm">{cidade?.label ?? '—'}</Text>
                </Box>
                <IconButtonTable
                  aria-label={text.removeButton}
                  mensegerTooltip={text.removeButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => handleRemove(cidade?.value)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            );
          })}
        </Flex>
      )}

      <Flex align="flex-end" gap={4}>
        <Box flex="1" maxW={{ base: 'full', md: '320px' }}>
          <SelectAsyncPaginate
            name="municipio-carregamento-staging"
            label={text.cidade}
            service={listCityOptions as any}
            pageSize={20}
            mapOptions={mapCityOption as any}
            findParams={(search: string | { search: string }) => ({
              search: typeof search === 'string' ? search : search.search,
            })}
            value={staging ?? undefined}
            onChange={(option: any) => setStaging(option ?? null)}
            isDisabled={disabled}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </Box>
        <Button
          type="button"
          title={text.addButton}
          icon={FiPlus as any}
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || !staging}
        />
      </Flex>
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Percurso (UFs) (`SURF-PERCURSO`, FD032, AC015/AC016, IG004/IG005) —
// staging: `uf` (Select, LK001); adicionar se truthy, resetar staging para a
// 1ª opção após adicionar; remover TODAS com a mesma `uf`.
// -----------------------------------------------------------------------------

function PercursoFieldArray({ control, disabled = false }: FieldArrayBaseProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.mdfes.mdfe.percurso;

  const { fields, append, remove } = useFieldArray({ control, name: 'percursos' });
  const [staging, setStaging] = useState<Option<string> | null>(ufOptions[0] ?? null);

  function handleAdd() {
    if (!staging?.value) return;
    const duplicateIndexes = fields
      .map((field, index) => ({ index, value: (field as any).uf?.value }))
      .filter((entry) => entry.value === staging.value)
      .map((entry) => entry.index);
    if (duplicateIndexes.length > 0) remove(duplicateIndexes);
    append({ uf: staging });
    // AC — reseta o staging para a 1ª opção após adicionar (mirror legado).
    setStaging(ufOptions[0] ?? null);
  }

  function handleRemove(uf: string | undefined) {
    const indexes = fields
      .map((field, index) => ({ index, value: (field as any).uf?.value }))
      .filter((entry) => entry.value === uf)
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
            const uf = (field as any).uf as Option<string> | null;
            return (
              <Flex key={field.id} align="center" gap={4}>
                <Box flex="1">
                  <Text fontSize="sm">{uf?.label ?? '—'}</Text>
                </Box>
                <IconButtonTable
                  aria-label={text.removeButton}
                  mensegerTooltip={text.removeButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => handleRemove(uf?.value)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            );
          })}
        </Flex>
      )}

      <Flex align="flex-end" gap={4}>
        <Box flex="1" maxW={{ base: 'full', md: '320px' }}>
          <Select
            label={text.uf}
            name="percurso-staging"
            value={staging}
            onChange={(option) => setStaging(option ?? null)}
            options={ufOptions}
            isDisabled={disabled}
          />
        </Box>
        <Button
          type="button"
          title={text.addButton}
          icon={FiPlus as any}
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || !staging}
        />
      </Flex>
    </Box>
  );
}

export default MdfeTabGeral;
