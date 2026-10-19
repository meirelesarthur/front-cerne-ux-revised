// src/pages/Fiscal/Mdfe/MdfeTabDescarga.tsx
// -----------------------------------------------------------------------------
// Aba 2 "Descarga" do formulário de MDFe — TASK-MDFE-FE-05
// (`CONTRATO-FRONT-MDFE.md §5.2/§5.4`, `FD049-FD059`). Recebe `control`/
// `register`/`errors` do ÚNICO `useForm` raiz de `CreateOrUpdateMdfe.tsx`
// (TASK-MDFE-FE-03) — NÃO instancia `useForm` próprio.
//
// `condutor_nome`/`condutor_cpf` — obrigatórios, participam do gate de
// Salvar (`CV006`, herdado da casca).
//
// Info Descarga (raiz, `SURF-DESCARGAS`) — subcoleção mais complexa do
// módulo: staging com `tp_unid_transp`/`id_unid_transp`/`quantidade_rateio`/
// `cidade_id` + 1 de 2 pares de documento (NFe/CTe), MAIS 2 sub-arrays
// locais de STAGING (`lacre_unidade_cargas`/`lacre_transportes`, dedupe por
// valor) e 1 sub-objeto ÚNICO de staging (`unidade_carga` — `hasOne` real,
// NÃO array, mirror docblock de divergência de cardinalidade em
// `@/@types/v2/Fiscal/Mdfe`) — todos só entram no payload quando a linha-PAI
// é adicionada (`IG016`). Remoção da linha-pai por `field.id` (equivalente
// ao `rand()` client-side do legado, `IG017`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Control, Controller, FieldErrors, useFieldArray, UseFormRegister } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { InputMask } from '@/components/Form/InputMask';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { onlyDigits } from '@/utils/cpfCnpj';
import { formatPlateProgressive, isValidPlate } from '@/utils/masks/plate';

import { columnsForm } from '@/constants/coluns-form';
import { mdfeUnidadeTransporteOptions } from '@/constants/Fiscal/mdfe-unidade-transporte-options';

import { listCityOptions } from '@/services/v2/Cities/city-service';

import type { Option } from '@/@types/option';
import type { CityListItem } from '@/@types/v2/Cities';
import type { InfoDescargaForm, LacreForm, MdfeForm } from '@/@types/v2/Fiscal/Mdfe';

// GAP-FE-245 (Bug 2)/EXECUÇÃO — mirror `MdfeTabGeral.tsx`: `cidade_id` de
// descarga é uuid validado por `exists:cities,uuid`; `/cities/options`
// pagina de verdade — `SelectAsyncPaginate` + `listCityOptions` (busca por
// texto, paginado) substitui o Select estático `per_page:100`.
function mapCityOption(item: CityListItem): Option<string> {
  return { value: item.uuid, label: item.title };
}

export interface MdfeTabDescargaProps {
  control: Control<MdfeForm>;
  register: UseFormRegister<MdfeForm>;
  errors: FieldErrors<MdfeForm>;
  disabled?: boolean;
}

export function MdfeTabDescarga({
  control,
  register,
  errors,
  disabled = false,
}: MdfeTabDescargaProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.mdfes.mdfe;
  const fields = text.form.fields;

  return (
    <Box pt={4}>
      <SimpleGrid columns={columnsForm.default} gap={6}>
        <Input
          label={fields.condutorNome}
          maxLength={60}
          {...register('condutor_nome')}
          error={errors.condutor_nome?.message}
          isRequired
          disabled={disabled}
        />

        <Controller
          name="condutor_cpf"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <InputMask
              label={fields.condutorCpf}
              name={field.name}
              mask="999.999.999-99"
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      <Box mt={6}>
        <InfoDescargaFieldArray control={control} errors={errors} disabled={disabled} />
      </Box>
    </Box>
  );
}

function InfoDescargaFieldArray({
  control,
  errors,
  disabled = false,
}: {
  control: Control<MdfeForm>;
  errors: FieldErrors<MdfeForm>;
  disabled?: boolean;
}) {
  const { languageGB } = useLanguage();
  const text = languageGB.mdfes.mdfe.infoDescarga;

  const { fields, append, remove } = useFieldArray({ control, name: 'info_descarga' });
  const arrayError = (errors.info_descarga as any)?.message as string | undefined;

  const unidadeOptions = mdfeUnidadeTransporteOptions.options(languageGB);

  // UT-000787 — só Rodoviário Tração (1) e Reboque (2) têm placa; Navio/Balsa/
  // Aeronave/Vagão/Outros (3..7) são identificador livre (D3), max 20 (mirror
  // `MdfeRequest max:20`).
  const plateMessage = languageGB.defaltStrings.validations.plateInvalid;
  const isPlateType = (tp: Option<number> | null) => tp?.value === 1 || tp?.value === 2;

  // ---- Staging da linha-PAI (`SURF-DESCARGAS`) ----------------------------
  const [tpUnidTransp, setTpUnidTransp] = useState<Option<number> | null>(
    unidadeOptions[0] ?? null
  );
  const [idUnidTransp, setIdUnidTransp] = useState('');
  const [idUnidTranspError, setIdUnidTranspError] = useState<string | undefined>();
  const [quantidadeRateio, setQuantidadeRateio] = useState<number | null>(null);
  const [cidadeId, setCidadeId] = useState<Option<string> | null>(null);
  const [chaveNfe, setChaveNfe] = useState('');
  const [segCodNfe, setSegCodNfe] = useState('');
  const [chaveCte, setChaveCte] = useState('');
  const [segCodCte, setSegCodCte] = useState('');

  // ---- Staging do sub-objeto ÚNICO Unidade de Carga (`hasOne`) -----------
  const [idUnidadeCarga, setIdUnidadeCarga] = useState('');
  const [unidadeCargaQuantidadeRateio, setUnidadeCargaQuantidadeRateio] = useState<number | null>(
    null
  );

  // ---- Staging LOCAL dos 2 netos (arrays reais, `hasMany`) — só entram no
  // payload quando a linha-pai é adicionada (`IG016`) --------------------
  const [lacreUnidadeCargaDraft, setLacreUnidadeCargaDraft] = useState<LacreForm[]>([]);
  const [lacreUnidadeCargaInput, setLacreUnidadeCargaInput] = useState('');
  const [lacreTransporteDraft, setLacreTransporteDraft] = useState<LacreForm[]>([]);
  const [lacreTransporteInput, setLacreTransporteInput] = useState('');

  const [inlineError, setInlineError] = useState<string | undefined>();

  function handleAddLacreUnidadeCarga() {
    const value = lacreUnidadeCargaInput.trim();
    if (!value) return;
    // IG014/IG015 — dedupe por valor.
    setLacreUnidadeCargaDraft((prev) => [
      ...prev.filter((item) => item.numero !== value),
      { numero: value },
    ]);
    setLacreUnidadeCargaInput('');
  }

  function handleRemoveLacreUnidadeCarga(numero: string) {
    setLacreUnidadeCargaDraft((prev) => prev.filter((item) => item.numero !== numero));
  }

  function handleAddLacreTransporte() {
    const value = lacreTransporteInput.trim();
    if (!value) return;
    // IG012/IG013 — dedupe por valor.
    setLacreTransporteDraft((prev) => [
      ...prev.filter((item) => item.numero !== value),
      { numero: value },
    ]);
    setLacreTransporteInput('');
  }

  function handleRemoveLacreTransporte(numero: string) {
    setLacreTransporteDraft((prev) => prev.filter((item) => item.numero !== numero));
  }

  function resetStaging() {
    setTpUnidTransp(unidadeOptions[0] ?? null);
    setIdUnidTransp('');
    setIdUnidTranspError(undefined);
    setQuantidadeRateio(null);
    // IG016 — mantém a cidade selecionada após adicionar (comportamento
    // observado do legado); NÃO reseta `cidadeId`.
    setChaveNfe('');
    setSegCodNfe('');
    setChaveCte('');
    setSegCodCte('');
    setIdUnidadeCarga('');
    setUnidadeCargaQuantidadeRateio(null);
    setLacreUnidadeCargaDraft([]);
    setLacreUnidadeCargaInput('');
    setLacreTransporteDraft([]);
    setLacreTransporteInput('');
  }

  function handleAddInfoDescarga() {
    // GAP-FE-LOTE2-ITEM2/3 (UT-000222/UT-000274) — AF_REJECTED: exigir o PAR
    // completo (chave + código de segurança) de UM dos 2 documentos travava
    // o "Adicionar" mesmo com "Chave NFe" preenchida (a única coisa que o
    // usuário reconhece como "documento de referência" — nem `chaveNfe` nem
    // `segCodNfe` têm asterisco de obrigatório na tela, então não há como o
    // usuário adivinhar que os 2 juntos eram exigidos). Confirmado contra o
    // legado real (`GB.Cerne.Api/resources/views/mdfe/_forms.blade.php`,
    // handler `#adicionar-info-descarga`): a condição de staging sempre foi
    // "QUALQUER UM dos 4 campos" — `chave_nfe || seg_cod_nfe || chave_cte ||
    // seg_cod_cte` —, nunca um AND por par.
    //
    // CORREÇÃO ADICIONAL (retest do dono, lote-2) — a 1ª rodada trocou o AND-
    // por-par pelo OR-entre-os-4-campos, mas MANTEVE documento de referência
    // como obrigatório (`!hasDocumentoReferencia` ainda bloqueava o
    // "Adicionar"). Isso não é fiel ao legado NEM ao backend:
    // `MdfeRequest::rules()` só marca `cidade_id`/`tp_unid_transp`/
    // `id_unid_transp`/`quantidade_rateio` como `required` — documento de
    // referência (`nfe_descarga`/`cte_descarga`) é 100% OPCIONAL por linha
    // (`sometimes`), só vira obrigatório PAR A PAR quando presente
    // (`required_with`). Removido `!hasDocumentoReferencia` do gate — os 4
    // campos base bastam. Em troca, adicionada validação de PAR INCOMPLETO
    // (mirror `required_with` do backend): preencher só `chaveNfe`/
    // `segCodNfe` OU só `chaveCte`/`segCodCte` isoladamente agora bloqueia
    // com mensagem específica, em vez de deixar o payload de submit
    // (`CreateOrUpdateMdfe.tsx::tryPersistMdfe`, `GAP-MDFE-FE-07`) descartar
    // o par incompleto em silêncio.
    if (!tpUnidTransp || !idUnidTransp.trim() || !quantidadeRateio || !cidadeId) {
      setInlineError(text.stagingMessage);
      return;
    }

    // UT-000787 — tipos 1/2: placa completa (antiga ou Mercosul).
    if (isPlateType(tpUnidTransp) && !isValidPlate(idUnidTransp)) {
      setIdUnidTranspError(plateMessage);
      return;
    }

    const nfePreenchidoParcial =
      (!!chaveNfe.trim() || !!segCodNfe.trim()) && !(chaveNfe.trim() && segCodNfe.trim());
    const ctePreenchidoParcial =
      (!!chaveCte.trim() || !!segCodCte.trim()) && !(chaveCte.trim() && segCodCte.trim());

    if (nfePreenchidoParcial || ctePreenchidoParcial) {
      setInlineError(text.incompletePairMessage);
      return;
    }

    const newRow: InfoDescargaForm = {
      tp_unid_transp: tpUnidTransp,
      id_unid_transp: isPlateType(tpUnidTransp)
        ? formatPlateProgressive(idUnidTransp)
        : idUnidTransp.trim(),
      quantidade_rateio: quantidadeRateio,
      cidade_id: cidadeId,
      chave_nfe: chaveNfe.trim(),
      seg_cod_nfe: segCodNfe.trim(),
      chave_cte: chaveCte.trim(),
      seg_cod_cte: segCodCte.trim(),
      unidade_carga: idUnidadeCarga.trim()
        ? {
            id_unidade_carga: idUnidadeCarga.trim(),
            quantidade_rateio: unidadeCargaQuantidadeRateio,
          }
        : null,
      lacre_unidade_cargas: lacreUnidadeCargaDraft,
      lacre_transportes: lacreTransporteDraft,
    };

    append(newRow);
    setInlineError(undefined);
    resetStaging();
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      {/* CORREÇÃO ADICIONAL (retest do dono, lote-2) — mesma correção de
          `MunicipiosCarregamentoFieldArray` (`MdfeTabGeral.tsx`): esta seção
          também participa do gate de Salvar (`canSaveGate`, `length >= 1`)
          mas não tinha indicação de obrigatoriedade — asterisco vermelho no
          título, mirror `ChakraField.RequiredIndicator` (`Field.tsx`). */}
      <Flex align="center" mb={4} gap="1">
        <Text fontSize="sm" fontWeight="semibold">
          {text.sectionTitle}
        </Text>
        <Text fontSize="sm" fontWeight="semibold" color="feedBack.errorMain">
          *
        </Text>
      </Flex>

      {arrayError && (
        <Text fontSize="sm" color="fg.error" mb={2}>
          {arrayError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'} mb={4}>
          {text.emptyText}
        </Text>
      ) : (
        <Flex direction="column" gap={3} mb={6}>
          {fields.map((field, index) => {
            const row = field as unknown as InfoDescargaForm & { id: string };
            const documento = row.chave_nfe
              ? `NFe ${row.chave_nfe}`
              : row.chave_cte
                ? `CTe ${row.chave_cte}`
                : '—';
            return (
              <Flex
                key={field.id}
                align="center"
                gap={4}
                p={3}
                bg="bg.default"
                borderRadius="md"
                border="1px solid"
                borderColor="border.subtle"
              >
                <Box flex="1">
                  <Text fontSize="sm">
                    {row.cidade_id?.label ?? '—'} — {row.id_unid_transp} — {documento}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {text.unidadeCarga.sectionTitle}: {row.unidade_carga?.id_unidade_carga ?? '—'} ·{' '}
                    {text.lacreUnidadeCarga.sectionTitle}: {row.lacre_unidade_cargas?.length ?? 0} ·{' '}
                    {text.lacreTransporte.sectionTitle}: {row.lacre_transportes?.length ?? 0}
                  </Text>
                </Box>
                <IconButtonTable
                  aria-label={text.removeButton}
                  mensegerTooltip={text.removeButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={disabled}
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

      <Box border="1px dashed" borderColor="border.subtle" borderRadius="lg" p={4}>
        <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
          {/* AJUSTE (lote-2, itens 2/3, não-bloqueante) — os 4 campos abaixo
              são exigidos pelo gate de `handleAddInfoDescarga` acima (mirror
              `MdfeRequest::rules()` — `tp_unid_transp`/`id_unid_transp`/
              `quantidade_rateio`/`cidade_id` são `required`), mas nenhum
              tinha asterisco — o usuário não tinha como saber quais campos
              da staging area eram obrigatórios. `isRequired` aditivo, só
              visual (asterisco no label via `Field`), nenhuma mudança de
              comportamento do gate. */}
          <Select
            label={text.tpUnidTransp}
            name="info-descarga-staging-tp-unid"
            value={tpUnidTransp}
            onChange={(option) => {
              const next = option ?? null;
              setTpUnidTransp(next);
              // UT-000787 — revalida o identificador ao trocar o tipo: placa
              // (1/2) reformata o texto atual e revalida; livre (3..7) limpa o
              // erro e corta em 20.
              if (isPlateType(next)) {
                const formatted = formatPlateProgressive(idUnidTransp);
                setIdUnidTransp(formatted);
                setIdUnidTranspError(
                  formatted && !isValidPlate(formatted) ? plateMessage : undefined
                );
              } else {
                setIdUnidTransp(idUnidTransp.slice(0, 20));
                setIdUnidTranspError(undefined);
              }
            }}
            options={unidadeOptions}
            isDisabled={disabled}
            isRequired
          />
          {isPlateType(tpUnidTransp) ? (
            <MaskedInput
              kind="plate"
              label={text.idUnidTransp}
              name="info-descarga-staging-id-unid"
              value={idUnidTransp}
              onChange={(event) => {
                const next = event.target.value;
                setIdUnidTransp(next);
                setIdUnidTranspError(undefined);
              }}
              onBlur={() =>
                setIdUnidTranspError(
                  idUnidTransp && !isValidPlate(idUnidTransp) ? plateMessage : undefined
                )
              }
              error={idUnidTranspError}
              disabled={disabled}
              isRequired
            />
          ) : (
            <Input
              label={text.idUnidTransp}
              name="info-descarga-staging-id-unid"
              maxLength={20}
              value={idUnidTransp}
              onChange={(event) => {
                setIdUnidTransp(event.target.value);
                setIdUnidTranspError(undefined);
              }}
              error={idUnidTranspError}
              disabled={disabled}
              isRequired
            />
          )}
          <NumberInput
            name="info-descarga-staging-quantidade"
            label={text.quantidadeRateio}
            value={quantidadeRateio}
            onValueChange={setQuantidadeRateio}
            allowDot
            decimalPlaces={2}
            disabled={disabled}
            isRequired
          />
          <SelectAsyncPaginate
            name="info-descarga-staging-cidade"
            label={text.cidade}
            service={listCityOptions as any}
            pageSize={20}
            mapOptions={mapCityOption as any}
            findParams={(search: string | { search: string }) => ({
              search: typeof search === 'string' ? search : search.search,
            })}
            value={cidadeId ?? undefined}
            onChange={(option: any) => setCidadeId(option ?? null)}
            isDisabled={disabled}
            isRequired
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mt={4}>
          <Input
            label={text.chaveNfe}
            maxLength={44}
            value={chaveNfe}
            onChange={(event) => setChaveNfe(onlyDigits(event.target.value))}
            inputMode="numeric"
            disabled={disabled}
          />
          <Input
            label={text.segCodNfe}
            value={segCodNfe}
            onChange={(event) => setSegCodNfe(onlyDigits(event.target.value))}
            inputMode="numeric"
            disabled={disabled}
          />
          <Input
            label={text.chaveCte}
            maxLength={44}
            value={chaveCte}
            onChange={(event) => setChaveCte(onlyDigits(event.target.value))}
            inputMode="numeric"
            disabled={disabled}
          />
          <Input
            label={text.segCodCte}
            value={segCodCte}
            onChange={(event) => setSegCodCte(onlyDigits(event.target.value))}
            inputMode="numeric"
            disabled={disabled}
          />
        </SimpleGrid>

        {/* ---- Unidade de Carga (sub-objeto ÚNICO, hasOne) ---- */}
        <Box mt={6}>
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={2}>
            {text.unidadeCarga.sectionTitle}
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Input
              label={text.unidadeCarga.idUnidadeCarga}
              value={idUnidadeCarga}
              onChange={(event) => setIdUnidadeCarga(event.target.value)}
              disabled={disabled}
            />
            <NumberInput
              name="info-descarga-staging-unidade-carga-quantidade"
              label={text.unidadeCarga.quantidadeRateio}
              value={unidadeCargaQuantidadeRateio}
              onValueChange={setUnidadeCargaQuantidadeRateio}
              allowDot
              decimalPlaces={2}
              disabled={disabled}
            />
          </SimpleGrid>
        </Box>

        {/* ---- Lacre de Unidade de Carga (neto, hasMany, staging local) ---- */}
        <Box mt={6}>
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={2}>
            {text.lacreUnidadeCarga.sectionTitle}
          </Text>
          {lacreUnidadeCargaDraft.length > 0 && (
            <Flex direction="column" gap={1} mb={2}>
              {lacreUnidadeCargaDraft.map((lacre) => (
                <Flex key={lacre.numero} align="center" gap={2}>
                  <Text fontSize="sm" flex="1">
                    {lacre.numero}
                  </Text>
                  <IconButtonTable
                    aria-label={text.lacreUnidadeCarga.removeButton}
                    mensegerTooltip={text.lacreUnidadeCarga.removeButton}
                    size="xs"
                    color="red.500"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => handleRemoveLacreUnidadeCarga(lacre.numero)}
                  >
                    <Icon as={FiTrash2} />
                  </IconButtonTable>
                </Flex>
              ))}
            </Flex>
          )}
          <Flex align="flex-end" gap={4}>
            <Box flex="1" maxW="240px">
              <Input
                label={text.lacreUnidadeCarga.numero}
                value={lacreUnidadeCargaInput}
                onChange={(event) => setLacreUnidadeCargaInput(event.target.value)}
                disabled={disabled}
              />
            </Box>
            <Button
              type="button"
              title={text.lacreUnidadeCarga.addButton}
              icon={FiPlus as any}
              variant="outline"
              size="sm"
              onClick={handleAddLacreUnidadeCarga}
              disabled={disabled}
            />
          </Flex>
        </Box>

        {/* ---- Lacre de Transporte (neto, hasMany, staging local) —
            GAP-MDFE-08 (backend, aguardando aprovação): UI preservada mesmo
            sabendo que o backend hoje não persiste este campo. ---- */}
        <Box mt={6}>
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={2}>
            {text.lacreTransporte.sectionTitle}
          </Text>
          {lacreTransporteDraft.length > 0 && (
            <Flex direction="column" gap={1} mb={2}>
              {lacreTransporteDraft.map((lacre) => (
                <Flex key={lacre.numero} align="center" gap={2}>
                  <Text fontSize="sm" flex="1">
                    {lacre.numero}
                  </Text>
                  <IconButtonTable
                    aria-label={text.lacreTransporte.removeButton}
                    mensegerTooltip={text.lacreTransporte.removeButton}
                    size="xs"
                    color="red.500"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => handleRemoveLacreTransporte(lacre.numero)}
                  >
                    <Icon as={FiTrash2} />
                  </IconButtonTable>
                </Flex>
              ))}
            </Flex>
          )}
          <Flex align="flex-end" gap={4}>
            <Box flex="1" maxW="240px">
              <Input
                label={text.lacreTransporte.numero}
                value={lacreTransporteInput}
                onChange={(event) => setLacreTransporteInput(event.target.value)}
                disabled={disabled}
              />
            </Box>
            <Button
              type="button"
              title={text.lacreTransporte.addButton}
              icon={FiPlus as any}
              variant="outline"
              size="sm"
              onClick={handleAddLacreTransporte}
              disabled={disabled}
            />
          </Flex>
        </Box>

        <Box mt={6}>
          <Button
            type="button"
            title={text.addButton}
            icon={FiPlus as any}
            variant="solid"
            size="sm"
            onClick={handleAddInfoDescarga}
            disabled={disabled}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default MdfeTabDescarga;
