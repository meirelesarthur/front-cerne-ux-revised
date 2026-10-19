// src/pages/Operacional/Appropriations/AppropriateAppropriation.tsx
// -----------------------------------------------------------------------------
// Tela dedicada "Apontamento - Apropriar" — REDESIGN COMPLETO (execução 034,
// TASK-FE-720/721/722), fidelidade estrita a `appropriation.blade.php` (263
// linhas, legado, lido por inteiro). Estrutura SEQUENCIAL mirror do legado:
// **Identificação** (100% readonly, 6 campos: Código, Dt. Apontamento,
// Responsável, Área, Área Utilizada, Descrição) → **MO/Serviços** (só se
// houver itens) → **Máq/Implementos** (só se houver itens, VL. Hora
// EDITÁVEL) → **Insumos** (só se houver itens) — cada seção de item com
// header próprio (`SectionHeader`, ícone+título, extensão local do
// `SectionTitle` privado de `AppropriationDetalhe.tsx`). Substitui o
// esqueleto genérico anterior (1 lista linear "Item — Centro de Custo |
// Tipo" para tudo junto, TASK-FE-2711/710/711 — todas supersedidas por esta
// rodada).
//
// Consome `useAppropriateItems` (TASK-FE-720) — 3 listas agrupadas
// (`labor`/`equipment`/`stock`), cada item já com os rótulos de exibição
// prontos (Executador/Un.Med. · Máq.Equip./Un.Med./VL.Hora ·
// Armazém/Produto/Un.Med.) — a tela não monta mais `typeLabels`/concatena
// strings. 3 `useFieldArray` (um por seção) em vez de 1 único `items`.
//
// "Tipo" (`class`) continua Select estático com as 2 opções do dicionário
// `Appropriation::opClass()` do legado (`app/Appropriation.php:350-362` +
// `lang/pt-BR/trad.php:2637-2638`): 1=Custeio, 2=Investimento.
//
// `items` do `appropriate` é OPCIONAL — Apontamento sem nenhum item lançado
// permite confirmar "Apropriar" mesmo com a lista vazia (auto-transição sem
// rateio, contrato §3/§8); linhas sem Centro de Custo preenchido são
// FILTRADAS do payload (rateio parcial é uma escolha válida do usuário, não
// bloqueia o submit) — regra aplicada às 3 listas juntas antes de montar o
// array `items`.
//
// "VL. Hora" (Máq/Implementos) é o ÚNICO campo de VALOR editável de toda a
// tela (mirror `appropriation.blade.php:154`) — nasce hidratado com o valor
// ATUAL persistido (`equipment_items[].amount`, exposto pelo hook como
// `currentAmount`) e é enviado como `vl_time` no payload
// (`AppropriateAppropriationRequest`/`AppropriateAppropriationAction` já
// tratam este campo — zero dependência de backend nesta rodada).
//
// Não é um form de edição do cabeçalho — não usa `fillForm`/Lei 2 porque não
// edita a Identificação, só popula rateio a partir de dado imutável nesta
// tela (mesma exceção já documentada nas rodadas anteriores deste módulo).
// -----------------------------------------------------------------------------

import { ElementType, ReactNode, useEffect, useState } from 'react';

import { Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { FiPackage, FiTruck, FiUsers } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { appropriateAppropriation } from '@/services/v2/Appropriations/appropriation-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';

import type { Option } from '@/@types/option';
import type { AppropriateItemPayload, AppropriationDetail } from '@/@types/v2/Appropriations';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

import { useAppropriateItems } from './useAppropriateItems';
import { useAppropriationForm } from './useAppropriations';

const APPROPRIATIONS_LIST_ROUTE = '/operacional/apontamentos';

interface AppropriateRowForm {
  center_uuid: Option<string> | null;
  class: Option<number> | null;
}

interface AppropriateEquipmentRowForm extends AppropriateRowForm {
  /** VL. Hora — mirror `appropriation.blade.php:154`, hidratado com
   *  `currentAmount` (`equipment_items[].amount`) e enviado como `vl_time`
   *  no payload de `appropriate` (TASK-FE-722). */
  vl_time: number | null;
}

interface AppropriateFormValues {
  labor: AppropriateRowForm[];
  equipment: AppropriateEquipmentRowForm[];
  stock: AppropriateRowForm[];
}

// Header de seção local (ícone+título) — extensão do `SectionTitle` privado
// de `AppropriationDetalhe.tsx` (mesmo `fontSize="sm"`/`fontWeight="semibold"`/
// `borderBottom`), com um `Icon` (`react-icons/fi`) à esquerda do título.
// Não promovido a `src/components/` (Regra F/escada de reuso, YAGNI) — sem
// 3º consumidor até aqui.
function SectionHeader({ icon, children }: { icon: ElementType; children: ReactNode }) {
  return (
    <Flex align="center" gap={2} mb={4} pb={2} borderBottom="1px solid" borderColor="border.subtle">
      <Icon as={icon} boxSize={4} color="fg.muted" />
      <Text fontSize="sm" fontWeight="semibold" color="fg.default">
        {children}
      </Text>
    </Flex>
  );
}

export default function AppropriateAppropriation() {
  const { appropriationId } = useParams<{ appropriationId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.appropriations.appropriation;
  const screenText = text.appropriateScreen;
  const canSubmit = can('appropriations_edit');

  const isValidId = isValidGuid(appropriationId);

  useEffect(() => {
    if (appropriationId && !isValidId) {
      navigate(APPROPRIATIONS_LIST_ROUTE, { replace: true });
    }
  }, [appropriationId, isValidId, navigate]);

  // Dicionário estático `Appropriation::opClass()` do legado — sem endpoint,
  // mirror `priorityOptions` de `AppropriationOccurrencesTab.tsx` (TASK-FE-710).
  const classOptions: Option<number>[] = [
    { value: 1, label: screenText.classOptions.custeio },
    { value: 2, label: screenText.classOptions.investimento },
  ];

  const { control, handleSubmit, reset } = useForm<AppropriateFormValues>({
    defaultValues: { labor: [], equipment: [], stock: [] },
  });
  const { fields: laborFields } = useFieldArray({ control, name: 'labor' });
  const { fields: equipmentFields } = useFieldArray({ control, name: 'equipment' });
  const { fields: stockFields } = useFieldArray({ control, name: 'stock' });

  const [detail, setDetail] = useState<AppropriationDetail | undefined>(undefined);

  // Não é um form de edição do cabeçalho — só precisamos do detalhe para ler
  // os itens/labels. `fillForm` aqui só guarda o detalhe (o `useEffect`
  // abaixo, sobre `grouped`, é quem (re)dimensiona as 3 listas de rateio 1:1
  // com as coleções).
  function fillForm(data: AppropriationDetail) {
    setDetail(data);
  }

  const appropriationQuery = useAppropriationForm({
    registrationId: isValidId ? appropriationId : undefined,
    fillForm,
  });

  const isLoading = checkLoadingStatus([appropriationQuery as any]);
  const grouped = useAppropriateItems(detail);

  useEffect(() => {
    reset({
      labor: grouped.labor.map(() => ({ center_uuid: null, class: classOptions[0] })),
      equipment: grouped.equipment.map((item) => ({
        center_uuid: null,
        class: classOptions[0],
        vl_time: item.currentAmount ?? null,
      })),
      stock: grouped.stock.map(() => ({ center_uuid: null, class: classOptions[0] })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grouped.labor.length, grouped.equipment.length, grouped.stock.length]);

  const hasAnyItem =
    grouped.labor.length > 0 || grouped.equipment.length > 0 || grouped.stock.length > 0;

  const mutation = useRequest({
    asyncFunction: async (data: AppropriateFormValues) => {
      if (!appropriationId) throw new Error('ID inválido');

      const laborItems = data.labor
        .map((row, index) => ({ row, flat: grouped.labor[index] }))
        .filter(({ row }) => !!row.center_uuid)
        .map(({ row, flat }): AppropriateItemPayload => ({
          type: flat.type,
          reference_uuid: flat.reference_uuid,
          center_uuid: row.center_uuid!.value,
          class: row.class?.value ?? undefined,
        }));

      const equipmentItems = data.equipment
        .map((row, index) => ({ row, flat: grouped.equipment[index] }))
        .filter(({ row }) => !!row.center_uuid)
        .map(({ row, flat }): AppropriateItemPayload => ({
          type: 'equipment',
          reference_uuid: flat.reference_uuid,
          center_uuid: row.center_uuid!.value,
          class: row.class?.value ?? undefined,
          vl_time: row.vl_time ?? undefined,
        }));

      const stockItems = data.stock
        .map((row, index) => ({ row, flat: grouped.stock[index] }))
        .filter(({ row }) => !!row.center_uuid)
        .map(({ row, flat }): AppropriateItemPayload => ({
          type: 'stock',
          reference_uuid: flat.reference_uuid,
          center_uuid: row.center_uuid!.value,
          class: row.class?.value ?? undefined,
        }));

      const items = [...laborItems, ...equipmentItems, ...stockItems];

      return await appropriateAppropriation(appropriationId, items.length > 0 ? items : undefined);
    },
    entityName: text.singularLabel,
    queryKey: queryKey.appropriations.appropriations,
    queryKey2: queryKey.appropriations.appropriation,
    typesRequest: 'update',
    personalizedMessage: screenText.appropriatedToast,
    actionSuccess: () => {
      navigate(`/operacional/apontamentos/${appropriationId}/detalhe`);
    },
  });

  function onSubmit(data: AppropriateFormValues) {
    mutation.mutate(data);
  }

  return (
    <FormContainer
      title={screenText.title}
      subtitle={screenText.subtitle}
      showDivider
      footer={
        <>
          <Button
            title={screenText.cancel}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
            disabled={mutation.isPending}
          />
          {canSubmit && (
            <Button
              title={screenText.submit}
              onClick={handleSubmit(onSubmit)}
              loading={mutation.isPending}
              disabled={mutation.isPending || isLoading}
            />
          )}
        </>
      }
    >
      <Text fontSize="sm" fontWeight="semibold" color="fg.muted" textTransform="uppercase" mb={3}>
        {screenText.headerTitle}
      </Text>

      <SimpleGrid columns={columnsForm.default} gap={6} mb={8}>
        <InputReadOnly
          label={text.form.fields.code}
          value={detail?.code ?? '—'}
          loading={isLoading}
        />
        <InputReadOnly
          label={text.form.fields.date}
          value={detail?.date ?? '—'}
          loading={isLoading}
        />
        <InputReadOnly
          label={text.form.fields.responsible}
          value={detail?.employee?.name ?? detail?.user?.name ?? '—'}
          loading={isLoading}
        />
        <InputReadOnly
          label={text.form.fields.area}
          value={detail?.area?.description ?? '—'}
          loading={isLoading}
        />
        <InputReadOnly
          label={text.form.fields.usedArea}
          value={
            detail?.used_area !== null && detail?.used_area !== undefined
              ? String(detail.used_area)
              : '—'
          }
          loading={isLoading}
        />
        <InputReadOnly
          label={text.form.fields.description}
          value={detail?.description ?? '—'}
          loading={isLoading}
        />
      </SimpleGrid>

      {!hasAnyItem && !isLoading && (
        <Text fontSize="sm" color="fg.muted" mb={6}>
          {screenText.itemsEmptyHint}
        </Text>
      )}

      {laborFields.length > 0 && (
        <Flex direction="column" mb={8}>
          <SectionHeader icon={FiUsers as ElementType}>{text.detail.sections.labor}</SectionHeader>
          <SimpleGrid columns={1} gap={4}>
            {laborFields.map((field, index) => (
              <SimpleGrid key={field.id} columns={columnsForm.fourColumns} gap={4} alignItems="end">
                <InputReadOnly
                  label={text.form.labor.fields.executor}
                  value={grouped.labor[index]?.executorLabel ?? '—'}
                />
                <InputReadOnly
                  label={text.form.labor.fields.measurement}
                  value={grouped.labor[index]?.measurementLabel ?? '—'}
                />

                <Controller
                  name={`labor.${index}.center_uuid`}
                  control={control}
                  render={({ field: rowField }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={screenText.fields.costCenter}
                      placeholder={screenText.placeholders.costCenter}
                      service={listCostCenterOptions}
                      mapOptions={(item: CostCenterRef) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        only_analytic: true,
                      })}
                      value={rowField.value ?? undefined}
                      onChange={(option: any) => rowField.onChange(option ?? null)}
                      isDisabled={!canSubmit}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />

                {/* "Tipo" (`class`) — Select estático, dicionário
                    `Appropriation::opClass()` do legado (TASK-FE-710). */}
                <Controller
                  name={`labor.${index}.class`}
                  control={control}
                  render={({ field: rowField }) => (
                    <Select
                      name={rowField.name}
                      label={screenText.fields.class}
                      value={rowField.value}
                      onChange={(option) => rowField.onChange(option ?? null)}
                      options={classOptions}
                      noClearable
                      isDisabled={!canSubmit}
                    />
                  )}
                />
              </SimpleGrid>
            ))}
          </SimpleGrid>
        </Flex>
      )}

      {equipmentFields.length > 0 && (
        <Flex direction="column" mb={8}>
          <SectionHeader icon={FiTruck as ElementType}>
            {text.detail.sections.equipment}
          </SectionHeader>
          <SimpleGrid columns={1} gap={4}>
            {equipmentFields.map((field, index) => (
              <SimpleGrid key={field.id} columns={columnsForm.fiveColumns} gap={4} alignItems="end">
                <InputReadOnly
                  label={text.form.equipment.fields.equipment}
                  value={grouped.equipment[index]?.equipmentLabel ?? '—'}
                />
                <InputReadOnly
                  label={text.form.equipment.fields.measurement}
                  value={grouped.equipment[index]?.measurementLabel ?? '—'}
                />

                {/* VL. Hora — ÚNICO campo de valor editável da tela, mirror
                    `appropriation.blade.php:154`; mesmo padrão de
                    `AppropriationEquipmentTab.tsx:144-158` (`Controller` +
                    `allowDot` + `decimalPlaces={2}` + `onValueChange`). */}
                <Controller
                  name={`equipment.${index}.vl_time`}
                  control={control}
                  render={({ field: rowField }) => (
                    <NumberInput
                      name={rowField.name}
                      label={screenText.fields.vlTime}
                      allowDot
                      decimalPlaces={2}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      disabled={!canSubmit}
                    />
                  )}
                />

                <Controller
                  name={`equipment.${index}.center_uuid`}
                  control={control}
                  render={({ field: rowField }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={screenText.fields.costCenter}
                      placeholder={screenText.placeholders.costCenter}
                      service={listCostCenterOptions}
                      mapOptions={(item: CostCenterRef) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        only_analytic: true,
                      })}
                      value={rowField.value ?? undefined}
                      onChange={(option: any) => rowField.onChange(option ?? null)}
                      isDisabled={!canSubmit}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />

                <Controller
                  name={`equipment.${index}.class`}
                  control={control}
                  render={({ field: rowField }) => (
                    <Select
                      name={rowField.name}
                      label={screenText.fields.class}
                      value={rowField.value}
                      onChange={(option) => rowField.onChange(option ?? null)}
                      options={classOptions}
                      noClearable
                      isDisabled={!canSubmit}
                    />
                  )}
                />
              </SimpleGrid>
            ))}
          </SimpleGrid>
        </Flex>
      )}

      {stockFields.length > 0 && (
        <Flex direction="column" mb={8}>
          <SectionHeader icon={FiPackage as ElementType}>
            {text.detail.sections.stock}
          </SectionHeader>
          <SimpleGrid columns={1} gap={4}>
            {stockFields.map((field, index) => (
              <SimpleGrid key={field.id} columns={columnsForm.fiveColumns} gap={4} alignItems="end">
                <InputReadOnly
                  label={text.form.stock.fields.warehouse}
                  value={grouped.stock[index]?.warehouseLabel ?? '—'}
                />
                <InputReadOnly
                  label={text.form.stock.fields.product}
                  value={grouped.stock[index]?.productLabel ?? '—'}
                />
                <InputReadOnly
                  label={text.form.stock.fields.measurement}
                  value={grouped.stock[index]?.measurementLabel ?? '—'}
                />

                <Controller
                  name={`stock.${index}.center_uuid`}
                  control={control}
                  render={({ field: rowField }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={screenText.fields.costCenter}
                      placeholder={screenText.placeholders.costCenter}
                      service={listCostCenterOptions}
                      mapOptions={(item: CostCenterRef) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        only_analytic: true,
                      })}
                      value={rowField.value ?? undefined}
                      onChange={(option: any) => rowField.onChange(option ?? null)}
                      isDisabled={!canSubmit}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />

                <Controller
                  name={`stock.${index}.class`}
                  control={control}
                  render={({ field: rowField }) => (
                    <Select
                      name={rowField.name}
                      label={screenText.fields.class}
                      value={rowField.value}
                      onChange={(option) => rowField.onChange(option ?? null)}
                      options={classOptions}
                      noClearable
                      isDisabled={!canSubmit}
                    />
                  )}
                />
              </SimpleGrid>
            ))}
          </SimpleGrid>
        </Flex>
      )}
    </FormContainer>
  );
}
