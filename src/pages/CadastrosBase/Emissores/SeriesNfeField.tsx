// src/pages/CadastrosBase/Emissores/SeriesNfeField.tsx
// -----------------------------------------------------------------------------
// Bloco "Séries de NF-e" do Emissor (UT-000780, D-101-02/D-101-05).
//
// UX-GAP declarado: o design system `cerne` não tem esse controle. Alvo visual
// provisório = padrão do bloco de IEs do `cerne` (`EmissorCadastro.tsx`): uma
// linha por item em grid `110px 1fr 140px 40px` (série | último número |
// padrão | excluir) + botão "adicionar". Cores só por tokens/semantic.
//
// Estado em RHF (`useFieldArray`) — edições sujam `dirtyFields.nfe_series`, o
// que alimenta o guard de submit. Regras: exatamente 1 série padrão; série em
// uso (`in_use`) não muda o número nem é removida (a API também bloqueia).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldErrors,
  UseFormGetValues,
  UseFormSetValue,
  useFieldArray,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { NumberInput } from '@/components/Form/NumberInput';
import { Checkbox } from '@/components/ui/checkbox';

import type { LanguageDate } from '@/@types/language';
import type { IssuerFormType, IssuerNfeSeriesForm } from '@/@types/v2/Issuers';

interface SeriesNfeFieldProps {
  control: Control<IssuerFormType>;
  errors: FieldErrors<IssuerFormType>;
  setValue: UseFormSetValue<IssuerFormType>;
  getValues: UseFormGetValues<IssuerFormType>;
  text: LanguageDate['issuers']['issuer']['form'];
  canSave: boolean;
  isLoading?: boolean;
}

const GRID_COLUMNS = { base: '1fr', md: '110px 1fr 140px 40px' };

export function emptySeriesRow(isDefault: boolean): IssuerNfeSeriesForm {
  return {
    uuid: null,
    serie: null,
    ultimo_numero: null,
    is_default: isDefault,
    is_active: true,
    in_use: false,
    min_ultimo_numero: 0,
  };
}

export function SeriesNfeField({
  control,
  errors,
  setValue,
  getValues,
  text,
  canSave,
  isLoading,
}: SeriesNfeFieldProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'nfe_series' });
  const seriesText = text.nfeSeries;

  const rootError =
    (errors.nfe_series as { root?: { message?: string }; message?: string } | undefined)?.root
      ?.message ?? (errors.nfe_series as { message?: string } | undefined)?.message;

  function handleAdd() {
    append(emptySeriesRow(fields.length === 0), { shouldFocus: false });
  }

  function handleSetDefault(index: number) {
    fields.forEach((_, i) => {
      setValue(`nfe_series.${i}.is_default`, i === index, {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
  }

  function handleRemove(index: number) {
    const removedWasDefault = !!getValues(`nfe_series.${index}.is_default`);
    remove(index);
    // Mantém sempre 1 padrão: promove a primeira série restante.
    if (removedWasDefault && fields.length > 1) {
      setValue('nfe_series.0.is_default', true, { shouldDirty: true, shouldValidate: true });
    }
  }

  return (
    <Box>
      {fields.length === 0 && (
        <Text fontSize="sm" color="fg.muted" mb={2}>
          {seriesText.empty}
        </Text>
      )}

      {fields.map((field, index) => {
        const inUse = !!field.in_use;
        const rowErrors = (errors.nfe_series as any)?.[index] as
          { serie?: { message?: string }; ultimo_numero?: { message?: string } } | undefined;
        return (
          <Box
            key={field.id}
            display="grid"
            gridTemplateColumns={GRID_COLUMNS}
            gap={4}
            alignItems="end"
            mb={3}
            role="group"
            aria-label={`${seriesText.serie} ${index + 1}`}
          >
            <Controller
              name={`nfe_series.${index}.serie`}
              control={control}
              render={({ field: f }) => (
                <NumberInput
                  name={f.name}
                  label={seriesText.serie}
                  value={f.value ?? null}
                  onValueChange={(value) => f.onChange(value)}
                  decimalPlaces={0}
                  error={rowErrors?.serie?.message}
                  isRequired
                  disabled={!canSave || isLoading || inUse}
                  title={inUse ? seriesText.inUse : undefined}
                />
              )}
            />
            <Controller
              name={`nfe_series.${index}.ultimo_numero`}
              control={control}
              render={({ field: f }) => (
                <NumberInput
                  name={f.name}
                  label={seriesText.ultimo}
                  value={f.value ?? null}
                  onValueChange={(value) => f.onChange(value)}
                  decimalPlaces={0}
                  error={rowErrors?.ultimo_numero?.message}
                  isRequired
                  disabled={!canSave || isLoading}
                />
              )}
            />
            <Controller
              name={`nfe_series.${index}.is_default`}
              control={control}
              render={({ field: f }) => (
                <Box pb={2}>
                  <Checkbox
                    checked={!!f.value}
                    // Desmarcar o padrão não é permitido: troca-se marcando outra.
                    onCheckedChange={(details: { checked: boolean | 'indeterminate' }) => {
                      if (details.checked === true) handleSetDefault(index);
                    }}
                    disabled={!canSave}
                    inputProps={{ name: f.name, title: seriesText.defaultHint }}
                  >
                    {seriesText.padrao}
                  </Checkbox>
                </Box>
              )}
            />
            <Button
              title=""
              variant="ghost_danger"
              icon={FiTrash2 as ElementType}
              tooltip={inUse ? seriesText.removeBlocked : seriesText.remove}
              onClick={() => handleRemove(index)}
              disabled={!canSave || inUse}
              aria-label={seriesText.remove}
            />
            {inUse && (
              <Text fontSize="xs" color="fg.muted" gridColumn="1 / -1" mt={-2}>
                {seriesText.inUse}
              </Text>
            )}
          </Box>
        );
      })}

      {rootError && (
        <Text role="alert" fontSize="sm" color="danger.default" mt={2}>
          {rootError}
        </Text>
      )}

      <Button
        title={seriesText.add}
        variant="outline"
        mt={3}
        icon={FiPlus as ElementType}
        onClick={handleAdd}
        disabled={!canSave}
      />
    </Box>
  );
}
