// src/pages/CadastrosBase/Produtos/Catalogo/ProdutoEstoqueFinanceiroTab.tsx
// -----------------------------------------------------------------------------
// 2ª aba do formulário de Produto ("Estoque e Financeiro", `TASK-FE-504`) —
// ARQUIVO SEPARADO, mesmo padrão de `_examples/CreateOrUpdateRecurso.tsx` +
// `RecursoConfiguracoesTab.tsx` (mirror do fork): recebe `control`/`watch`/
// `errors` do form-pai (`CreateOrUpdateProduto.tsx`, `TASK-FE-503`) — NÃO cria
// `useForm` próprio, só contribui campos ao MESMO form.
//
// MIRROR declarado (Regra de precedência do agente fino — `get_pwa_*` não
// estão no runtime desta sessão): instrução direta do task-packet +
// `src/pages/CadastrosBase/ContasBancarias/CreateOrUpdateContaBancaria.tsx`
// (`CheckboxListField`+`farmUuidsTouched`, presence-aware de array) +
// `_examples/pages/cadastros/recursos/RecursoConfiguracoesTab.tsx` (casca de
// aba em arquivo separado) + `Embalagens/CreateOrUpdateEmbalagem.tsx`
// (`Controller`+`NumberInput`/`SelectAsyncPaginate` para campo mascarado).
//
// ⚠️ CORREÇÃO CRÍTICA vs. a presunção da `TASK-FE-503` (ver
// `@types/v2/Products/index.d.ts`, nota de topo): o `ProductResource` REAL
// (lido diretamente em `api_root`) ANINHA as 6 FKs desta aba
// (`financial_category`/`default_cost_center`/`default_warehouse`/
// `cultivation`/`addressing`/`tax_rule`, todas `{uuid, description}` — exceto
// `default_cost_center`, que também traz `code`) — NÃO chegam como string
// crua. `ProductRepository` faz eager-load INCONDICIONAL dessas relações
// (`create`/`update`/`findByUuidOrFail`), então o prefill hidrata o LABEL
// REAL sem GET extra e sem precisar do padrão "tolerante a fora-do-catálogo"
// (`bank` de `CreateOrUpdateContaBancaria.tsx`) — esse padrão só seria
// necessário se o Resource de fato devolvesse uuid cru, o que NÃO é o caso
// aqui (achado desta Tarefa, documentado em `CreateOrUpdateProduto.tsx`).
//
// Campos mascarados/numéricos SEMPRE via `Controller` (nunca `register()`
// puro — armadilha conhecida do domínio): `las_price` (`MoneyInput`),
// `min_stock` (`NumberInput`, [[padrao-numberinput-mascara-fill-direita]]).
//
// ⚠️ MIGRADO (TASK-FE-948, pedido direto do dev, 2026-07-30): o trio
// `second_measurement_uuid`/`factor_type`/`factor` (validação cruzada
// `required_with` em `product-schema.ts::.when()`, `TASK-FE-500`) SAIU deste
// arquivo e agora renderiza em `CreateOrUpdateProduto.tsx` (Aba 1
// "Identificação"), adjacente a `measurement_uuid` — a mesma unidade lógica
// de medida fica inteira na mesma aba, então o erro de validação cruzada
// (antes invisível se o usuário estivesse na Aba 1, causa raiz do
// ERRO-FE-015) agora aparece onde o usuário está. Nenhuma mudança de
// `name=`/`control`/schema/payload — só o arquivo onde o JSX renderiza.
//
// ⚠️ MIGRADO (TASK-FE-950, pedido direto do dev, 2026-07-31 — `GAP-FE-162`
// aprovado): o Select `tax_rule_uuid` SAIU deste arquivo e agora renderiza em
// `ProdutoFiscalTab.tsx` (Aba 3 "Fiscal"), junto dos 35 campos que o
// `onChange` dele preenche via autofill — mesmo racional de diagnosticabilidade
// da `TASK-FE-948` (efeito visível na mesma aba do gatilho, sem cegueira entre
// abas, causa raiz do `ERRO-FE-015`). Nenhuma mudança de `name=`/`control`/
// schema/payload/service (`listTaxRuleEntityOptions` continua o mesmo) — só o
// arquivo onde o JSX renderiza.
//
// `cultivation_uuid`/`quality`/`product_package_uuids` — condicionais ao
// grupo "Produção" (D8, `isProductionGroup` reexportado de
// `product-schema.ts`, única fonte da string "Produção"): a UI DESABILITA
// (não esconde — decisão de simplicidade, evita layout saltando) os 3 campos
// fora desse grupo, com hint explicando o motivo. `product_package_uuids`
// (pivot Embalagens, `TASK-BE-506`/`GAP-BE-230`) segue a 4ª regra de
// fidelidade do task-packet — "o grupo manda, não a lista": o backend faz
// detach total quando o grupo submetido não é "Produção", mesmo que o front
// envie uuids válidos. Por isso este componente NÃO tenta limpar/preservar o
// array ao trocar de grupo — só desabilita a edição, sem lutar contra o
// comportamento do backend.
//
// ⚠️ ARMADILHA `dirtyFields` + ARRAY (RHF 7.51.2, provada no código-fonte
// desta execução — `CreateOrUpdateContaBancaria.tsx`/`CreateOrUpdateEmissor.tsx`):
// `dirtyFields.product_package_uuids` NÃO é um boolean — react-hook-form
// recursa para dentro do array e devolve um ARRAY de booleans por índice, que
// é sempre truthy como objeto JS. `packageUuidsTouched` (estado do form-pai,
// recebido via prop + setter) substitui `dirtyFields.product_package_uuids`
// no guard presence-aware do `onSubmit`/`tryPersistProduct` — setado aqui, no
// `onChange` do `CheckboxListField`, nunca lido de `dirtyFields`.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, GridItem, SimpleGrid, Text } from '@chakra-ui/react';
import { Control, Controller, FieldErrors, UseFormWatch } from 'react-hook-form';

import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { SelectCultivation } from '@/components/Form/SelectCultivation';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { columnsForm } from '@/constants/coluns-form';

import { isProductionGroup } from '@/validations/schemas/CadastrosBase/product-schema';

import { listAddressingOptions } from '@/services/v2/Addressing/addressing-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { AddressingOption } from '@/@types/v2/Addressing/addressing';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { ProductData, ProductForm as ProductFormType } from '@/@types/v2/Products';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { usePackageOptionsList } from './useProducts';
import { WRAPPING_SELECT_COMPONENTS } from './WrappingSingleValue';

import { FormSection } from '@/components/FormSection';
// Catálogos "flat" (`/options`, `ApiResponse::success`, sem paginação real —
// `warehouses`/`addressings`/`measurements`/`cultivations`) — `pageSize`
// MAIOR que o volume real do catálogo evita que `SelectAsyncPaginate`
// (`items.length === pageSize`) dispare uma 2ª página fantasma sobre uma
// resposta já completa (ver nota nos services correspondentes). 3 dos 4
// catálogos (56/poucas dezenas por fazenda/24 linhas) não chegam perto deste
// teto; `cultivations` foi ADICIONADO nesta constante (TASK-FE-947) por
// medir até ~31 linhas por fazenda em produção — acima do `pageSize` padrão
// (10) do `SelectAsyncPaginate`, que dispararia a 2ª página fantasma sem
// este teto. `tax_rule_uuid` (TASK-FE-941, `listTaxRuleEntityOptions`) NÃO
// usa esta constante — catálogo medido em produção com no máximo 5 linhas
// por fazenda, abaixo do `pageSize` padrão.
const FLAT_CATALOG_PAGE_SIZE = 200;

interface ProdutoEstoqueFinanceiroTabProps {
  control: Control<ProductFormType>;
  errors: FieldErrors<ProductFormType>;
  watch: UseFormWatch<ProductFormType>;
  isLoading: boolean;
  canSave: boolean;
  isEditing: boolean;
  /** `average_cost` só renderiza em edição (`InputReadOnly`) — lido direto do
   *  `ProductData`, nunca do `useForm` (somente-leitura, D2 do contrato). */
  productData?: ProductData;
  /** Setter da flag `packageUuidsTouched` do form-pai — só a ESCRITA importa
   *  aqui (disparada no `onChange` do `CheckboxListField`); o VALOR atual só
   *  é consumido em `tryPersistProduct` (`CreateOrUpdateProduto.tsx`), fora
   *  deste componente. */
  setPackageUuidsTouched: (value: boolean) => void;
  /** TASK-FE-036-B16 — repassado pelo form-pai (`ProductFormFields.tsx`) SÓ
   *  quando este componente monta dentro de um `Dialog`
   *  (`ProductFormModal`), mirror `disablePortal` de `ClientFormFields.tsx`:
   *  sem isso, os menus dos `SelectAsyncPaginate` desta aba renderizam
   *  portalizados em `document.body`, fora da árvore de Portal do Dialog —
   *  visíveis porém não-clicáveis. `undefined`/`false` na página cheia
   *  (fora de qualquer Dialog), comportamento intocado. */
  disablePortal?: boolean;
}

// Formatação monetária pt-BR — mesma resolução em poucas linhas já usada em
// `CreateOrUpdateContaBancaria.tsx::formatCurrencyBRL` (nenhum util global de
// currency existe no fork, Regra F).
function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ProdutoEstoqueFinanceiroTab({
  control,
  errors,
  watch,
  isLoading,
  canSave,
  isEditing,
  productData,
  setPackageUuidsTouched,
  disablePortal,
}: ProdutoEstoqueFinanceiroTabProps) {
  const { languageGB } = useLanguage();
  const { hasFarm } = usePermissions();
  const text = languageGB.products.product;

  // D8 (Product-contrato.md §6): `cultivation_uuid`/`quality`/
  // `product_package_uuids` só habilitados quando o Grupo (Aba 1) é
  // "Produção" — mesma constante/função de `product-schema.ts`, nunca
  // duplicada.
  const groupValue = watch('group_uuid');
  const isProduction = isProductionGroup(groupValue ?? undefined);

  // ---- CheckboxListField de Embalagens (`product_package_uuids`) ---------
  // Busca CLIENT-SIDE (catálogo tenant-scoped pequeno, 161 linhas totais —
  // mirror `useFarmsList`/`CreateOrUpdateContaBancaria.tsx`), sem paginação
  // real necessária.
  const [packageSearchValue, setPackageSearchValue] = useState('');
  // Guard de fazenda ativa (`farm.context` ESTRITO, `product-packages/options`
  // — Product-contrato.md §17.2) — mesmo padrão de `hasFarm` já usado pelo
  // form-pai (`CreateOrUpdateProduto.tsx`) para a query de detalhe.
  const packageOptionsQuery = usePackageOptionsList(hasFarm);
  const packageItems = useMemo(() => {
    const all = packageOptionsQuery.data ?? [];
    const filtered = packageSearchValue
      ? all.filter((item) =>
          item.description.toLowerCase().includes(packageSearchValue.toLowerCase())
        )
      : all;
    return filtered.map((item) => ({ value: item.uuid, label: item.description }));
  }, [packageOptionsQuery.data, packageSearchValue]);

  return (
    <Box pt={4}>
      <FormSection title={text.form.stockSections.stock} divider={false}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
        <Controller
          name="min_stock"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={text.form.fields.minStock}
              allowDot
              decimalPlaces={2}
              min={0}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={fieldState.error?.message}
              disabled={!canSave || isLoading}
            />
          )}
        />

        <Controller
          name="control_stock"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={text.form.fields.controlStock}
              name={name}
              value={
                [
                  { value: true, label: languageGB.defaltStrings.yes },
                  { value: false, label: languageGB.defaltStrings.no },
                ].find((o) => o.value === value) ?? null
              }
              onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
              options={[
                { value: true, label: languageGB.defaltStrings.yes },
                { value: false, label: languageGB.defaltStrings.no },
              ]}
              isRequired
              isDisabled={!canSave}
              loading={isLoading}
              noClearable
            />
          )}
        />

        <Controller
          name="las_price"
          control={control}
          render={({ field, fieldState }) => (
            <MoneyInput
              name={field.name}
              label={text.form.fields.lasPrice}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={fieldState.error?.message}
              isRequired
              disabled={!canSave || isLoading}
            />
          )}
        />

        {/* `average_cost` — somente-leitura, SÓ em edição (D2 do contrato de
            API) — lido direto do `ProductData`, fora do `useForm`/payload. */}
        {isEditing && (
          <InputReadOnly
            label={text.form.fields.averageCost}
            helperText={text.form.hints.averageCostReadOnly}
            value={productData ? formatCurrencyBRL(productData.average_cost) : ''}
            loading={isLoading}
          />
        )}
      </SimpleGrid>
      </FormSection>

      {/* `active_principle` — TASK-FE-948 (pedido direto do dev): o trio
          `second_measurement_uuid`/`factor_type`/`factor` que dividia este
          `SimpleGrid` migrou para `CreateOrUpdateProduto.tsx` (Aba 1,
          adjacente a `measurement_uuid`), para que o erro de validação
          cruzada (`required_with` no Yup, `product-schema.ts::.when()`,
          ERRO-FE-015) fique visível na mesma aba onde o usuário edita a
          unidade de medida. `active_principle` fica sozinho aqui, sem
          alteração de comportamento (Chakra `SimpleGrid` renderiza
          normalmente com 1 item). */}
      <FormSection title={text.form.stockSections.additional} divider={false}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
        {/* UT-000781: 50 caracteres não cabem em 1 de 4 colunas num notebook —
            ocupa 2 colunas a partir de `md`. */}
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Controller
            name="active_principle"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label={text.form.fields.activePrinciple}
                maxLength={50}
                name={field.name}
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
                error={fieldState.error?.message}
                loading={isLoading}
                disabled={!canSave}
              />
            )}
          />
        </GridItem>
      </SimpleGrid>
      </FormSection>

      <FormSection title={text.form.stockSections.allocation} divider={false}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
        <Controller
          name="financial_category_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.form.fields.financialCategory}
              placeholder={text.form.placeholders.financialCategory}
              service={listFinancialCategoryOptions}
              mapOptions={(item: FinancialCategoryOption) => ({
                label: `${item.code} — ${item.description}`,
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
          name="default_warehouse_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.form.fields.defaultWarehouse}
              placeholder={text.form.placeholders.defaultWarehouse}
              service={listWarehouseOptions}
              pageSize={FLAT_CATALOG_PAGE_SIZE}
              mapOptions={(item: WarehouseOption) => ({
                label: `${item.initials} — ${item.description}`,
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
          name="default_cost_center_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.form.fields.defaultCostCenter}
              placeholder={text.form.placeholders.defaultCostCenter}
              service={listCostCenterOptions}
              mapOptions={(item: CostCenterRef) => ({
                label: `${item.code} — ${item.description}`,
                value: item.uuid,
              })}
              // TASK-FE-982 (pedido direto do dev, E2E manual 2026-07-31) —
              // só Centros de Custo ANALÍTICOS (`CostCenter.class ===
              // ANALYTICAL`, `only_analytic` de `TASK-BE-358`, já suportado
              // por `listCostCenterOptions`): o select misturava Sintéticos
              // ("1.01 — Administração") com Analíticos ("1.01.001 —
              // Escritório Central") — regra é CLASSE do Centro de Custo, não
              // profundidade de nested-set nem a coluna `type`
              // (Produtivo/Rateado, outra dimensão).
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                only_analytic: true,
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
          name="addressing_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.form.fields.addressing}
              placeholder={text.form.placeholders.addressing}
              service={listAddressingOptions}
              pageSize={FLAT_CATALOG_PAGE_SIZE}
              // Hierarquia até 4 níveis, prefixo "— " por nível (Doc Bruta,
              // Product-Frontend-Contrato.md §3.3) — `type` 1..4, sem prefixo
              // no nível 1 (Setor).
              mapOptions={(item: AddressingOption) => ({
                label: `${'— '.repeat(Math.max(0, item.type - 1))}${item.description}`,
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
      </SimpleGrid>
      </FormSection>

      <FormSection title={text.form.stockSections.production} divider={false}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
        <Controller
          name="cultivation_uuid"
          control={control}
          render={({ field }) => (
            <SelectCultivation
              name={field.name}
              label={text.form.fields.cultivation}
              placeholder={text.form.placeholders.cultivation}
              tooltip={
                isProduction
                  ? text.form.hints.cultivationRequiredForProductionGroup
                  : text.form.hints.cultivationDisabledOutsideProductionGroup
              }
              error={errors.cultivation_uuid?.message as string | undefined}
              value={field.value ?? null}
              onChange={(option) => field.onChange(option ?? null)}
              isRequired={isProduction}
              isDisabled={!isProduction || !canSave || isLoading}
              // `SelectCultivation` não expõe `disablePortal` (mirror
              // `CreateProductFromXmlModal.tsx`) — omitir `menuPortalTarget`
              // produz o mesmo efeito (react-select só portala quando o
              // target é passado).
              menuPortalTarget={disablePortal ? undefined : document.body}
              menuPosition={disablePortal ? 'absolute' : 'fixed'}
            />
          )}
        />

        <Controller
          name="quality"
          control={control}
          render={({ field }) => (
            <Input
              label={text.form.fields.quality}
              placeholder={text.form.placeholders.quality}
              maxLength={191}
              name={field.name}
              value={field.value ?? ''}
              onChange={(event) => field.onChange(event.target.value)}
              tooltip={
                !isProduction ? text.form.hints.qualityDisabledOutsideProductionGroup : undefined
              }
              error={errors.quality?.message as string | undefined}
              loading={isLoading}
              disabled={!isProduction || !canSave}
            />
          )}
        />
      </SimpleGrid>
      </FormSection>

      {/* Pivot Embalagens (`product_package_uuids`, TASK-BE-506/GAP-BE-230) —
          presence-aware: `packageUuidsTouched` (prop do form-pai) substitui
          `dirtyFields.product_package_uuids` no submit (ver cabeçalho do
          arquivo). Desabilitado fora do grupo "Produção" — 4ª regra de
          fidelidade (backend detacha tudo se o grupo não for "Produção",
          independente do que for enviado; a UI não luta contra isso). */}
      <FormSection title={text.form.stockSections.packages} divider={false}>
        <Controller
          name="product_package_uuids"
          control={control}
          render={({ field }) => (
            <CheckboxListField
              label={text.form.fields.packages}
              items={packageItems}
              selectedValues={field.value ?? []}
              onChange={(values) => {
                field.onChange(values);
                setPackageUuidsTouched(true);
              }}
              searchValue={packageSearchValue}
              onSearchChange={setPackageSearchValue}
              searchPlaceholder={text.form.packagesField.searchPlaceholder}
              selectAllLabel={text.form.packagesField.selectAllLabel}
              deselectAllLabel={text.form.packagesField.deselectAllLabel}
              selectedCountLabel={text.form.packagesField.selectedCountLabel}
              emptyLabel={text.form.packagesField.emptyLabel}
              isLoading={packageOptionsQuery.isLoading}
              isError={packageOptionsQuery.isError}
              errorLabel={text.form.packagesField.errorLabel}
              onRetry={() => packageOptionsQuery.refetch()}
              retryLabel={text.form.packagesField.retryLabel}
              isDisabled={!isProduction || !canSave}
            />
          )}
        />
        {!isProduction && (
          <Text fontSize="xs" color="fg.muted" mt={1}>
            {text.form.hints.packagesDisabledOutsideProductionGroup}
          </Text>
        )}
      </FormSection>
    </Box>
  );
}
