// src/pages/CadastrosBase/Produtos/Catalogo/ProductFormFields.tsx
// -----------------------------------------------------------------------------
// TASK-FE-036-B16 — EXTRAÍDO de `CreateOrUpdateProduto.tsx` (recorte-e-cola
// literal do JSX do wizard de 3 abas + rodapé), mirror EXATO da extração já
// feita para Cliente (`ClientFormFields.tsx`/`TASK-MV-FE-10`). Componente
// PURO de campos: recebe o retorno de `useProductFormController` + `canSave`
// + `onCancel` (a página cheia passa `() => navigate(-1)`; o futuro
// `ProductFormModal` passa `onClose`) + `disablePortal` (repassado às Abas 2/3
// e aos Selects da Aba 1 — mesma armadilha de Dialog v3 já documentada em
// `ClientFormFields.tsx`/`CreateProductFromXmlModal.tsx`: sem isso, os menus
// portalizados em `document.body` ficam visíveis porém não-clicáveis dentro
// do Dialog).
//
// `xmlNcmHintLabel` — só a página cheia repassa (hint da querystring do fluxo
// legado "+ Criar Produto"); o Modal nunca passa (fica `undefined`).
// -----------------------------------------------------------------------------

import { EmptyState, GridItem, Icon, SimpleGrid, Tabs, VStack } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';
import { FiBox } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormFooter } from '@/components/FormFooter';

import { useLanguage } from '@/hooks/useLanguage';

import { productFactorTypeOptions } from '@/constants/cadastrosBase/product/product-factor-type-options';
import { columnsForm } from '@/constants/coluns-form';
import { statusOptions } from '@/constants/options/statusOptions';

import { listCategoryProductOptions } from '@/services/v2/CategoryProducts/category-product-service';
import { listKindOptions } from '@/services/v2/Kinds/kind-service';
import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';
import { listNcmOptions } from '@/services/v2/Ncms/ncm-service';
import { listProductGroupOptions } from '@/services/v2/ProductGroups/product-group-service';

import type { Option } from '@/@types/option';
import type { CategoryProductOption } from '@/@types/v2/CategoryProducts';
import type { KindOption } from '@/@types/v2/Kinds';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { NcmOption } from '@/@types/v2/Ncms';
import type { ProductGroupOption } from '@/@types/v2/ProductGroups/product-group';

import { ProductDescriptionField } from './ProductDescriptionField';
import { ProdutoEstoqueFinanceiroTab } from './ProdutoEstoqueFinanceiroTab';
import { ProdutoFiscalTab } from './ProdutoFiscalTab';
import { PRODUCT_FORM_FLAT_CATALOG_PAGE_SIZE } from './useProductFormController';
import { WRAPPING_SELECT_COMPONENTS } from './WrappingSingleValue';

import type { useProductFormController } from './useProductFormController';

export type ProductFormFieldsProps = ReturnType<typeof useProductFormController> & {
  isEditing: boolean;
  /** Cancelar — página cheia passa `() => navigate(-1)`, `ProductFormModal`
   *  passa `onClose`. */
  onCancel: () => void;
  /** Repassado à Aba 1 (Selects locais) + Abas 2/3 (arquivos separados) —
   *  `true` SÓ quando este componente monta dentro de um `Dialog`
   *  (`ProductFormModal`), mirror `ClientFormFields`/`disablePortal`. */
  disablePortal?: boolean;
  /** Hint da querystring (fluxo legado "+ Criar Produto") — só a página
   *  cheia repassa. */
  xmlNcmHintLabel?: string | null;
  /** `true` (default) — renderiza o rodapé INLINE (usado pelo
   *  `ProductFormModal`, que não tem footer fixo próprio). A página cheia
   *  passa `false` e monta os mesmos botões no footer FIXO do `FormContainer`
   *  via `ProductFormFooter` (padrão EST-07, mirror do wizard Equipamento). */
  renderFooter?: boolean;
};

// Botões do rodapé do wizard de Produto — extraídos para serem montados tanto
// no footer FIXO do `FormContainer` (página cheia) quanto INLINE (modal).
export function ProductFormFooter({
  tabValue,
  handleNext,
  handleBack,
  isSubmitting,
  isLoading,
  canSave,
  onCancel,
}: Pick<
  ProductFormFieldsProps,
  'tabValue' | 'handleNext' | 'handleBack' | 'isSubmitting' | 'isLoading' | 'canSave' | 'onCancel'
>) {
  const { languageGB } = useLanguage();

  return (
    <>
      {/* Cancelar só na 1ª aba (Identificação) — nas abas seguintes o
          "Anterior" já dá o caminho de volta; some para não duplicar. */}
      {tabValue === '0' && (
        <Button
          title={languageGB.defaltStrings?.cancel || 'Cancelar'}
          variant="secondary"
          onClick={onCancel}
          type="button"
        />
      )}
      {tabValue !== '0' && (
        <Button
          title={languageGB.defaltStrings.previous}
          variant="outline"
          onClick={handleBack}
          type="button"
          disabled={isSubmitting}
        />
      )}
      {tabValue !== '2' ? (
        <Button
          title={languageGB.defaltStrings.next}
          onClick={handleNext}
          type="button"
          disabled={isSubmitting || isLoading}
        />
      ) : (
        canSave && (
          <Button
            title={languageGB.defaltStrings.save}
            onClick={handleNext}
            type="button"
            loading={isSubmitting}
            disabled={isSubmitting || isLoading}
          />
        )
      )}
    </>
  );
}

export function ProductFormFields({
  control,
  register,
  errors,
  watch,
  setValue,
  groupValue,
  categoryValue,
  ncmRequiredForGroup,
  setPackageUuidsTouched,
  tabValue,
  setTabValue,
  handleNext,
  handleBack,
  isSubmitting,
  isLoading,
  productData,
  hasFarm,
  canSave,
  isEditing,
  onCancel,
  disablePortal,
  xmlNcmHintLabel,
  renderFooter = true,
}: ProductFormFieldsProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.products.product;

  const yesNoOptions: Option<boolean>[] = [
    { value: true, label: languageGB.defaltStrings.yes },
    { value: false, label: languageGB.defaltStrings.no },
  ];

  // Sem fazenda ativa E em edição: não há como buscar o registro a editar —
  // EmptyState informativo em vez do form (mesmo racional de
  // Embalagens/ContaBancaria, mirror `CreateOrUpdateProduto.tsx`).
  if (isEditing && !hasFarm) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <Icon as={FiBox} boxSize={8} color="fg.muted" />
          </EmptyState.Indicator>
          <VStack textAlign="center" gap={1}>
            <EmptyState.Title>{text.list.noFarmSelected.title}</EmptyState.Title>
            <EmptyState.Description>{text.list.noFarmSelected.description}</EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    );
  }

  return (
    <Form onSubmit={(e) => e.preventDefault()} noPadding>
      {/* @ts-ignore - custom variant */}
      <Tabs.Root
        value={tabValue}
        onValueChange={(details: { value: string }) => setTabValue(details.value as any)}
        variant="outline"
      >
        {/* @ts-ignore */}
        {/* @ts-ignore - Tab List fixa (sticky) no topo do body: abas sempre
            visíveis; só o conteúdo rola. */}
        <Tabs.List position="sticky" top="0" zIndex={1} bg="formBG">
          {/* @ts-ignore */}
          <Tabs.Trigger value="0">{text.form.tabs.identification}</Tabs.Trigger>
          {/* @ts-ignore */}
          <Tabs.Trigger value="1">{text.form.tabs.stockFinancial}</Tabs.Trigger>
          {/* @ts-ignore */}
          <Tabs.Trigger value="2">{text.form.tabs.fiscal}</Tabs.Trigger>
        </Tabs.List>

        {/* @ts-ignore */}
        <Tabs.Content value="0">
          {/* Ordem em `lg` (4 colunas), sem buracos, igual em criar/editar:
              L1: Código | Descrição (2 col.) | Unidade
              L2: 2ª Unidade | Tipo de Fator | Fator | Grupo
              L3: Categoria | Classe | Ativo | É Equipamento
              L4: Controla Lote | NCM (3 col.)
              Os spans só valem a partir de `lg`; abaixo disso é 1 coluna/campo. */}
          <SimpleGrid columns={columnsForm.default} gap={6} pt={4}>
            <InputReadOnly
              label={text.form.fields.code}
              helperText={text.form.hints.codeGeneratedByServer}
              value={isEditing ? (productData?.code ?? '') : text.form.placeholders.code}
              loading={isLoading}
            />

            <GridItem colSpan={{ base: 1, lg: 2 }}>
              <ProductDescriptionField
                label={text.form.fields.description}
                placeholder={text.form.placeholders.description}
                maxLength={181}
                {...register('description')}
                error={errors.description?.message}
                isRequired
                loading={isLoading}
                disabled={!canSave}
              />
            </GridItem>

            <Controller
              name="measurement_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.measurement}
                  placeholder={text.form.placeholders.measurement}
                  error={errors.measurement_uuid?.message as string | undefined}
                  service={listMeasurementOptions}
                  pageSize={PRODUCT_FORM_FLAT_CATALOG_PAGE_SIZE}
                  mapOptions={(item: MeasurementOption) => ({
                    label: item.description,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isRequired
                  isDisabled={!canSave || isLoading}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  disablePortal={disablePortal}
                  components={WRAPPING_SELECT_COMPONENTS}
                />
              )}
            />

            <Controller
              name="second_measurement_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.secondMeasurement}
                  placeholder={text.form.placeholders.secondMeasurement}
                  error={errors.second_measurement_uuid?.message as string | undefined}
                  service={listMeasurementOptions}
                  pageSize={PRODUCT_FORM_FLAT_CATALOG_PAGE_SIZE}
                  mapOptions={(item: MeasurementOption) => ({
                    label: item.description,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isDisabled={!canSave || isLoading}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  disablePortal={disablePortal}
                  components={WRAPPING_SELECT_COMPONENTS}
                />
              )}
            />

            <Controller
              name="factor_type"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.factorType}
                  name={name}
                  value={
                    productFactorTypeOptions.options(languageGB).find((o) => o.value === value) ??
                    null
                  }
                  onChange={(opt: Option<'M' | 'D'> | null) => onChange(opt?.value ?? null)}
                  options={productFactorTypeOptions.options(languageGB)}
                  error={error?.message}
                  isDisabled={!canSave}
                  loading={isLoading}
                  disablePortal={disablePortal}
                />
              )}
            />

            <Controller
              name="factor"
              control={control}
              render={({ field, fieldState }) => (
                <NumberInput
                  name={field.name}
                  label={text.form.fields.factor}
                  allowDot
                  decimalPlaces={2}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  error={fieldState.error?.message}
                  disabled={!canSave || isLoading}
                />
              )}
            />
            <Controller
              name="group_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.group}
                  placeholder={text.form.placeholders.group}
                  error={errors.group_uuid?.message as string | undefined}
                  service={listProductGroupOptions}
                  mapOptions={(item: ProductGroupOption) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => {
                    field.onChange(option ?? null);
                    setValue('category_uuid', null, { shouldDirty: true });
                    setValue('kind_uuid', null, { shouldDirty: true });
                  }}
                  isRequired
                  isDisabled={!canSave || isLoading}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  disablePortal={disablePortal}
                  components={WRAPPING_SELECT_COMPONENTS}
                />
              )}
            />

            <Controller
              name="category_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.category}
                  placeholder={
                    groupValue
                      ? text.form.placeholders.category
                      : text.form.placeholders.categoryDisabledHint
                  }
                  error={errors.category_uuid?.message as string | undefined}
                  isDisabled={!groupValue || !canSave || isLoading}
                  service={listCategoryProductOptions}
                  mapOptions={(item: CategoryProductOption) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    group_uuid: groupValue?.value,
                  })}
                  cacheUniqs={[groupValue?.value]}
                  value={field.value ?? null}
                  onChange={(option: any) => {
                    field.onChange(option ?? null);
                    setValue('kind_uuid', null, { shouldDirty: true });
                  }}
                  isRequired
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  disablePortal={disablePortal}
                  components={WRAPPING_SELECT_COMPONENTS}
                />
              )}
            />

            <Controller
              name="kind_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.kind}
                  placeholder={
                    categoryValue
                      ? text.form.placeholders.kind
                      : text.form.placeholders.kindDisabledHint
                  }
                  error={errors.kind_uuid?.message as string | undefined}
                  isDisabled={!categoryValue || !canSave || isLoading}
                  service={listKindOptions}
                  mapOptions={(item: KindOption) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    category_uuid: categoryValue?.value,
                  })}
                  cacheUniqs={[categoryValue?.value]}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isRequired
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  disablePortal={disablePortal}
                  components={WRAPPING_SELECT_COMPONENTS}
                />
              )}
            />
            <Controller
              name="is_enabled"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.form.fields.isEnabled}
                  name={name}
                  value={statusOptions.options(languageGB).find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                  options={statusOptions.options(languageGB)}
                  isRequired
                  isDisabled={!canSave}
                  loading={isLoading}
                  noClearable
                  disablePortal={disablePortal}
                />
              )}
            />

            <Controller
              name="is_equipment"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.form.fields.isEquipment}
                  // D7: o tooltip descreve o redirecionamento pós-salvar, que só
                  // existe na página cheia (o modal não navega).
                  tooltip={renderFooter ? undefined : text.form.hints.isEquipment}
                  name={name}
                  value={yesNoOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                  options={yesNoOptions}
                  isRequired
                  isDisabled={!canSave}
                  loading={isLoading}
                  noClearable
                  disablePortal={disablePortal}
                />
              )}
            />

            <Controller
              name="has_lot"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.form.fields.hasLot}
                  name={name}
                  value={yesNoOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                  options={yesNoOptions}
                  isRequired
                  isDisabled={!canSave}
                  loading={isLoading}
                  noClearable
                  disablePortal={disablePortal}
                />
              )}
            />

            <GridItem colSpan={{ base: 1, lg: 3 }}>
              <Controller
                name="ncm_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.form.fields.ncm}
                    placeholder={text.form.placeholders.ncm}
                    helperText={
                      xmlNcmHintLabel
                        ? `${text.form.hints.ncmXmlSuggestionPrefix}: ${xmlNcmHintLabel}`
                        : ncmRequiredForGroup
                          ? text.form.hints.ncmRequiredForProductionGroup
                          : text.form.hints.ncmSearchMinLength
                    }
                    error={errors.ncm_uuid?.message as string | undefined}
                    service={listNcmOptions}
                    mapOptions={(item: NcmOption) => ({
                      label: item.code ? `${item.code} — ${item.description}` : item.description,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isRequired={ncmRequiredForGroup}
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    disablePortal={disablePortal}
                    components={WRAPPING_SELECT_COMPONENTS}
                  />
                )}
              />
            </GridItem>
          </SimpleGrid>
        </Tabs.Content>

        {/* @ts-ignore */}
        <Tabs.Content value="1">
          <ProdutoEstoqueFinanceiroTab
            control={control}
            errors={errors}
            watch={watch}
            isLoading={!!isLoading}
            canSave={canSave}
            isEditing={isEditing}
            productData={productData}
            setPackageUuidsTouched={setPackageUuidsTouched}
            disablePortal={disablePortal}
          />
        </Tabs.Content>

        {/* @ts-ignore */}
        <Tabs.Content value="2">
          <ProdutoFiscalTab
            control={control}
            register={register}
            errors={errors}
            isLoading={!!isLoading}
            canSave={canSave}
            productData={productData}
            setValue={setValue}
            disablePortal={disablePortal}
          />
        </Tabs.Content>
      </Tabs.Root>

      {/* Modal (`renderFooter` default true) monta o rodapé INLINE; a página
          cheia passa `renderFooter={false}` e usa o footer FIXO do
          `FormContainer` com o mesmo `ProductFormFooter`. */}
      {renderFooter && (
        <FormFooter noPadding>
          <ProductFormFooter
            tabValue={tabValue}
            handleNext={handleNext}
            handleBack={handleBack}
            isSubmitting={isSubmitting}
            isLoading={isLoading}
            canSave={canSave}
            onCancel={onCancel}
          />
        </FormFooter>
      )}
    </Form>
  );
}
