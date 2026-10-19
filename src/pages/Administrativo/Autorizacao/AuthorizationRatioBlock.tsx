// src/pages/Administrativo/Autorizacao/AuthorizationRatioBlock.tsx
// -----------------------------------------------------------------------------
// Bloco "Rateio" do Ordenador de despesa (execução 081, T-081-FE-06; legado
// `_forms.blade.php:411-525` e `second.blade.php:303-422`). Visível conforme
// `authorization_context.requires_ratio_block` (calculado no servidor).
//
// Legado reproduzido:
//   - "Classificação": select N "Não Classificado", C "CAPEX", O "OPEX", com a ajuda
//     CAPEX/OPEX;
//   - "Safra": select das safras habilitadas;
//   - linha inicial com 100,00; "Categoria" assíncrona (mínimo de 3 letras, tipo
//     Saídas) e "Centro de Custo" da fazenda da solicitação (analíticos habilitados);
//     sem cascata categoria para centro (o legado não tinha);
//   - ao sair do campo de porcentagem, total acima de 100 zera o campo e avisa
//     ("A soma dos valores da porcentagem ultrapassam 100%.");
//   - rodapé "Total" com a soma. As validações de envio (Safra, Classificação, soma 100, categoria e centro)
//     ficam em `authorizationRules.validateRatio`, chamadas pela tela.
// Componente controlado: o estado mora no container (usado no payload do envio).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { PercentInput } from '@/components/Form/PercentInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { queryKey } from '@/constants/query-key';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { listHarvests } from '@/services/v2/Harvests/harvest-service';

import type { Option } from '@/@types/option';
import type { ResponsePagination } from '@/@types/response-api';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { RequestClassification } from '@/@types/v2/RequestPurchases';

import {
  initialRatioRows,
  ratioExceedsTotal,
  ratioTotal,
  type RatioRow,
} from './authorizationRules';

/** Mínimo de letras para buscar categoria (legado: select2 AJAX, 3 letras). */
export const CATEGORY_MIN_CHARS = 3;
/** Categoria do tipo Saídas (`type=1` do `financialcategoriesFilter` do legado). */
const CATEGORY_TYPE_OUTPUT = 1;

/** Estado do rateio guardado pelo container. */
export interface RatioState {
  classification: RequestClassification | '';
  harvestUuid: string;
  rows: RatioRow[];
}

export function initialRatioState(): RatioState {
  return { classification: '', harvestUuid: '', rows: initialRatioRows() };
}

const EMPTY_CATEGORY_PAGE: ResponsePagination<FinancialCategoryOption[]> = {
  success: true,
  message: '',
  data: {
    items: [],
    pagination: { total: 0, count: 0, per_page: 0, current_page: 1, total_pages: 1 },
  },
} as ResponsePagination<FinancialCategoryOption[]>;

// Só consulta com 3 letras ou mais; abaixo disso a lista fica vazia (sem chamada).
async function searchCategories(params: { search?: string; page?: number; per_page?: number }) {
  if ((params.search ?? '').trim().length < CATEGORY_MIN_CHARS) return EMPTY_CATEGORY_PAGE;
  return listFinancialCategoryOptions({
    ...params,
    type_id: CATEGORY_TYPE_OUTPUT,
    is_enabled: 'true',
    cost_center_scoped: 'true',
  });
}

export interface AuthorizationRatioBlockProps {
  /** `uuid` da fazenda da solicitação (centros de custo habilitados dela). */
  farmUuid?: string;
  value: RatioState;
  onChange: (next: RatioState) => void;
  disabled?: boolean;
  /** Erro de Safra obrigatória (D-100-14); a regra mora no container, o bloco só exibe. */
  harvestError?: string;
  /** Erro de Classificação obrigatória (D-100-17). */
  classificationError?: string;
}

export function AuthorizationRatioBlock({
  farmUuid,
  value,
  onChange,
  disabled = false,
  harvestError,
  classificationError,
}: AuthorizationRatioBlockProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestAuthorizations.requestAuthorization.detail.ratio;
  const validationText =
    languageGB.requestAuthorizations.requestAuthorization.detail.clientValidation;

  const [pickedCategories, setPickedCategories] = useState<Record<string, Option>>({});
  const [pickedCenters, setPickedCenters] = useState<Record<string, Option>>({});

  const harvestsQuery = useQuery({
    queryKey: [queryKey.requestAuthorizations.requestAuthorization, 'ratio-harvests'],
    queryFn: async () => (await listHarvests({ is_enabled: 'true', per_page: 100 })).data.items,
    refetchOnWindowFocus: false,
  });

  const classificationOptions = useMemo<Option<string>[]>(
    () =>
      (['N', 'C', 'O'] as const).map((key) => ({
        label: text.classificationOptions[key],
        value: key,
      })),
    [text]
  );

  // Safras habilitadas, mais recentes primeiro (legado: `start_date` desc).
  const harvestOptions = useMemo<Option<string>[]>(
    () =>
      [...(harvestsQuery.data ?? [])]
        .sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''))
        .map((harvest) => ({ label: harvest.description, value: harvest.uuid })),
    [harvestsQuery.data]
  );

  function updateRow(index: number, patch: Partial<RatioRow>) {
    onChange({
      ...value,
      rows: value.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    });
  }

  function handlePercentBlur(index: number) {
    if (!ratioExceedsTotal(value.rows)) return;
    toaster.create({
      title: validationText.warningTitle,
      description: validationText.ratioOverflow,
      type: 'warning',
    });
    updateRow(index, { percent: 0 });
  }

  function addRow() {
    onChange({
      ...value,
      rows: [...value.rows, { category_uuid: '', center_uuid: '', percent: null }],
    });
  }

  function removeRow(index: number) {
    onChange({ ...value, rows: value.rows.filter((_, rowIndex) => rowIndex !== index) });
  }

  return (
    <Box>
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="fg.default"
        mb={4}
        pb={2}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        {text.title}
      </Text>

      <Flex gap={4} mb={4} wrap="wrap">
        <Box flex="1" minW="220px">
          <Select
            name="ratio-classification"
            label={text.classificationLabel}
            placeholder={text.harvestPlaceholder}
            tooltip={text.classificationHelp}
            isRequired
            error={classificationError}
            options={classificationOptions}
            value={
              classificationOptions.find((option) => option.value === value.classification) ?? null
            }
            onChange={(option: Option<string> | null) =>
              onChange({
                ...value,
                classification: (option?.value as RequestClassification | undefined) ?? '',
              })
            }
            isDisabled={disabled}
          />
        </Box>
        <Box flex="1" minW="220px">
          <Select
            name="ratio-harvest"
            label={text.harvestLabel}
            placeholder={text.harvestPlaceholder}
            options={harvestOptions}
            isRequired
            error={harvestError}
            value={harvestOptions.find((option) => option.value === value.harvestUuid) ?? null}
            onChange={(option: Option<string> | null) =>
              onChange({ ...value, harvestUuid: option?.value ?? '' })
            }
            loading={harvestsQuery.isLoading}
            isDisabled={disabled}
          />
        </Box>
      </Flex>

      <Flex direction="column" gap={4} mb={4}>
        {value.rows.map((row, index) => (
          // A ordem das linhas só muda por adicionar no fim ou remover; índice é estável o bastante.
          // eslint-disable-next-line react/no-array-index-key
          <Flex key={index} gap={3} align="flex-start" wrap="wrap">
            <Box flex="1" minW="220px">
              <SelectAsyncPaginate
                name={`ratio-category-${index}`}
                label={text.categoryLabel}
                placeholder={text.categoryPlaceholder}
                helperText={text.categoryMinChars}
                isRequired
                service={searchCategories}
                mapOptions={(item: FinancialCategoryOption) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                cacheUniqs={[index]}
                value={row.category_uuid ? (pickedCategories[row.category_uuid] ?? null) : null}
                onChange={(option: any) => {
                  if (option) {
                    setPickedCategories((prev) => ({ ...prev, [option.value]: option }));
                  }
                  updateRow(index, { category_uuid: option?.value ?? '' });
                }}
                isDisabled={disabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </Box>

            <Box flex="1" minW="220px">
              <SelectAsyncPaginate
                name={`ratio-center-${index}`}
                label={text.centerLabel}
                placeholder={text.centerPlaceholder}
                isRequired
                service={listCostCenterOptions}
                mapOptions={(item: CostCenterRef) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  only_analytic: true,
                  is_enabled: 'true',
                  farm_uuid: farmUuid,
                })}
                cacheUniqs={[farmUuid]}
                value={row.center_uuid ? (pickedCenters[row.center_uuid] ?? null) : null}
                onChange={(option: any) => {
                  if (option) {
                    setPickedCenters((prev) => ({ ...prev, [option.value]: option }));
                  }
                  updateRow(index, { center_uuid: option?.value ?? '' });
                }}
                isDisabled={disabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </Box>

            <Box w={{ base: 'full', sm: '160px' }}>
              <PercentInput
                name={`ratio-percent-${index}`}
                label={text.percentLabel}
                isRequired
                maxValue={100}
                value={row.percent}
                onValueChange={(percent) => updateRow(index, { percent })}
                onBlur={() => handlePercentBlur(index)}
                disabled={disabled}
              />
            </Box>

            {value.rows.length > 1 && (
              <Flex direction="column" gap="1.5">
                <Flex alignItems="center" fontSize="14px" visibility="hidden">
                  {text.removeRowButton}
                </Flex>
                <IconButtonTable
                  aria-label={text.removeRowButton}
                  mensegerTooltip={text.removeRowButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => removeRow(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            )}
          </Flex>
        ))}
      </Flex>

      <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
        <Button
          title={text.addRowButton}
          icon={FiPlus as any}
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={disabled}
        />
        <Text fontSize="sm" fontWeight="semibold" aria-live="polite">
          {text.totalLabel}:{' '}
          {ratioTotal(value.rows).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </Flex>
    </Box>
  );
}
