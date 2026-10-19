// src/pages/Operacional/CompraAnimais/MovementPurchaseFinancialHeader.tsx
// -----------------------------------------------------------------------------
// 088 D3-FE-T2 — cabeçalho do título financeiro da Compra de Animais (S2a-S5b +
// entrada S3). Paridade com o legado (contrato D3 §3.1): Nº do Título, Tipo do
// Título, Proprietário Gestor, Histórico, Possui Entrada?, (Data/Valor da
// Entrada), Dedutível e Classificação.
//
// Regras de tela:
//  - Entrada (data/valor) só é VISÍVEL com `Possui Entrada? = Sim`; com `Não`
//    os dois campos são limpos (não vão ao payload) — o `onHasInputChange` avisa
//    o pai/seção de parcelas (a linha 1 da tabela, origin `input`, é removida
//    pela `MovementPurchaseInstallmentsSection`). NÃO regenera parcelas sozinho
//    (decisão do dono P-FE-2: só o botão "Gerar", com confirmação).
//  - `has_input` nasce `null` ("Selecione") no create.
//  - Tokens semânticos; textos via i18n; sem estado de servidor fora do TanStack.
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Control, Controller, FieldErrors, UseFormSetValue, useWatch } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { Input } from '@/components/Form/Input';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';

import { columnsForm } from '@/constants/coluns-form';

import { listTypeTitleOptions } from '@/services/v2/BaseRegistrations/typeTitles-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type {
  MovementPurchaseClassification,
  MovementPurchaseForm,
} from '@/@types/v2/MovementPurchases';

export interface MovementPurchaseFinancialHeaderProps {
  control: Control<MovementPurchaseForm>;
  setValue: UseFormSetValue<MovementPurchaseForm>;
  errors: FieldErrors<MovementPurchaseForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
  /** Notifica a escolha de "Possui Entrada?" (a limpeza dos campos já é feita aqui). */
  onHasInputChange?: (hasInput: boolean | null) => void;
}

const NOTE_MAX_TYPING = 200;
const NUMBER_MAX_LENGTH = 15;

export const PROPRIETARY_OPTIONS_QUERY_KEY = ['movement-purchase', 'proprietaries-options', 'farm'];

export function MovementPurchaseFinancialHeader({
  control,
  setValue,
  errors,
  languageGB,
  disabled = false,
  onHasInputChange,
}: MovementPurchaseFinancialHeaderProps) {
  const text = languageGB.movementPurchases.movementPurchase.form.financial.header;

  const hasInput = useWatch({ control, name: 'financial_has_input' });

  const proprietaryQuery = useQuery({
    queryKey: PROPRIETARY_OPTIONS_QUERY_KEY,
    queryFn: () => listProprietaryOptions(undefined, 'farm'),
    refetchOnWindowFocus: false,
    retry: false,
  });
  const proprietaryOptions: Option<string>[] = (proprietaryQuery.data ?? []).map((item) => ({
    label: item.label,
    value: item.uuid,
  }));

  const yesNoOptions: Option<boolean>[] = [
    { label: text.yes, value: true },
    { label: text.no, value: false },
  ];

  const classificationOptions: Option<MovementPurchaseClassification>[] = [
    { label: text.classificationNone, value: 'N' },
    { label: text.classificationCapex, value: 'C' },
    { label: text.classificationOpex, value: 'O' },
  ];

  const err = (key: keyof MovementPurchaseForm) =>
    (errors as Record<string, { message?: string } | undefined>)[key]?.message;

  return (
    <Box
      bg="bg.muted"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      p={4}
      data-testid="purchase-financial-header"
    >
      <Text fontSize="sm" fontWeight="semibold" mb={1}>
        {text.sectionTitle}
      </Text>
      <Text fontSize="xs" color="fg.muted" mb={4}>
        {text.sectionHint}
      </Text>

      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name="financial_number"
          control={control}
          render={({ field }) => (
            <Input
              name={field.name}
              label={text.number}
              maxLength={NUMBER_MAX_LENGTH}
              value={field.value ?? ''}
              onChange={(event) => field.onChange(event.target.value)}
              onBlur={field.onBlur}
              error={err('financial_number')}
              isRequired
              disabled={disabled}
            />
          )}
        />

        <Controller
          name="financial_type_title"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.typeTitle}
              placeholder={text.typeTitlePlaceholder}
              service={listTypeTitleOptions}
              mapOptions={(item: { uuid: string; description: string }) => ({
                label: item.description,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                is_enabled: 'true',
              })}
              value={field.value ?? null}
              onChange={(selected) => field.onChange((selected as Option<string> | null) ?? null)}
              error={err('financial_type_title')}
              isRequired
              isDisabled={disabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name="financial_proprietary"
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.proprietary}
              placeholder={text.proprietaryPlaceholder}
              options={proprietaryOptions}
              value={field.value ?? null}
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              loading={proprietaryQuery.isLoading}
              error={err('financial_proprietary')}
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name="financial_has_input"
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.hasInput}
              placeholder={text.hasInputPlaceholder}
              options={yesNoOptions}
              value={yesNoOptions.find((option) => option.value === field.value) ?? null}
              onChange={(option: Option<boolean> | null) => {
                const next = option ? option.value : null;
                field.onChange(next);
                if (next !== true) {
                  setValue('financial_input_date', null, { shouldDirty: true });
                  setValue('financial_input_value', null, { shouldDirty: true });
                }
                onHasInputChange?.(next);
              }}
              error={err('financial_has_input')}
              isRequired
              noClearable
              isDisabled={disabled}
            />
          )}
        />

        {hasInput === true && (
          <>
            <Controller
              name="financial_input_date"
              control={control}
              render={({ field }) => (
                <DateInput
                  label={text.inputDate}
                  value={field.value ?? null}
                  onChange={(value) => field.onChange(value)}
                  error={err('financial_input_date')}
                  isRequired
                  disabled={disabled}
                />
              )}
            />
            <Controller
              name="financial_input_value"
              control={control}
              render={({ field }) => (
                <MoneyInput
                  name={field.name}
                  label={text.inputValue}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  error={err('financial_input_value')}
                  isRequired
                  disabled={disabled}
                />
              )}
            />
          </>
        )}

        <Controller
          name="financial_fiscal_document"
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.fiscalDocument}
              options={yesNoOptions}
              value={yesNoOptions.find((option) => option.value === field.value) ?? null}
              onChange={(option: Option<boolean> | null) => field.onChange(option?.value ?? null)}
              error={err('financial_fiscal_document')}
              isRequired
              noClearable
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name="financial_classification"
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.classification}
              options={classificationOptions}
              value={classificationOptions.find((option) => option.value === field.value) ?? null}
              onChange={(option: Option<MovementPurchaseClassification> | null) =>
                field.onChange(option?.value ?? null)
              }
              error={err('financial_classification')}
              isRequired
              noClearable
              isDisabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      <Box mt={4} w="full">
        <Controller
          name="financial_note"
          control={control}
          render={({ field }) => (
            <Textarea
              name={field.name}
              label={text.note}
              rows={4}
              maxLength={NOTE_MAX_TYPING}
              value={field.value ?? ''}
              onChange={(event) => field.onChange(event.target.value)}
              onBlur={field.onBlur}
              error={err('financial_note')}
              isRequired
              disabled={disabled}
            />
          )}
        />
      </Box>
    </Box>
  );
}

export default MovementPurchaseFinancialHeader;
