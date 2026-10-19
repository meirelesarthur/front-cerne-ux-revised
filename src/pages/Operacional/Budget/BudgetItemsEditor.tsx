// src/pages/Operacional/Budget/BudgetItemsEditor.tsx
// -----------------------------------------------------------------------------
// Editor de itens do formulário de CRIAÇÃO/EDIÇÃO de Orçamento (Budget —
// Operacional / Vendas, F-018, 97-Esteiras/054, TASK-BG-FE-03). Consumido por
// `CreateOrUpdateBudget.tsx` (campo `items` de `BudgetForm`).
//
// Mirror ESTRUTURAL DIRETO de `Administrativo/Requisition/
// RequisitionItemsEditor.tsx` (`useFieldArray` vive no formulário PAI —
// `control`/`fields`/`append`/`remove`/`errors` chegam via props, Roteiro
// `TASK-BG-FE-03`).
//
// Linha (`FLD-07..14`, `budgets-legacy-contract.md`):
//   - `product` — `SelectAsyncPaginate` sobre `listProductOptions` filtrado
//     por `category_type: categoryProductType.production` (mirror EXATO do
//     irmão já migrado NESTA MESMA feature, `FilterSideBudget.tsx`/
//     `ContratosVenda/CreateOrUpdateContratoVenda.tsx` — convenção REAL do
//     fork para "categoria PRODUCTION", precedente sobre a redação literal
//     do contrato de tela §4.6 que citava `listProducts` + "param fixo": um
//     `category_uuid` fixo não é implementável sem resolver a categoria por
//     tipo em runtime, e o enum `category_type` JÁ É esse "param fixo").
//   - `unit` — `InputReadOnly`, populada do CACHE local do próprio
//     `ProductOptionResource` (`measurement.description`, mirror
//     `stockCacheRef` do irmão) — nunca um 2º request.
//   - `amount` (valor unitário) — GAP-BG-FE-08 (achado desta Tarefa, não
//     bloqueante): `ProductOptionResource` (`/products/options`) NÃO expõe
//     `las_price` (confirmado por leitura direta de
//     `app/Http/Resources/V1/ProductOptionResource.php` no `api_root`) — só
//     `ProductResource` completo (`/products/{uuid}`, `GET /products`) o
//     expõe. Em vez de fabricar o valor ou deixar de preencher o default
//     (FLD-10, "criar: preenchido do data-value do produto no change"),
//     esta Tarefa busca o produto completo sob demanda (`getProduct(uuid)`,
//     serviço já existente) SÓ no `onChange` do select — mesmo racional já
//     aceito nesta feature para "Copiar link público" (`Budget/index.tsx`,
//     GAP-BG-FE-07 2ª parte: "busca o detalhe sob demanda em vez de
//     fabricar"). `amount` é SEMPRE EDITÁVEL depois do fill (Risco 1 da
//     Tarefa — diferente de Requisição, cujo `value` fica sempre readonly);
//     o preenchimento é IMPERATIVO (dentro do handler), nunca uma reação
//     contínua a `product` via `useEffect` — por isso um valor editado
//     manualmente não é sobrescrito por nenhum outro recálculo (só uma NOVA
//     troca de produto reaplica o default, fiel ao "no change" do legado).
//   - `discount` — `MoneyInput`, opcional. IG-03 (desconto > total da linha)
//     já é coberto pelo `.test()` do Yup (`budget-schema.ts`, fundação
//     TASK-BG-FE-01) — não duplicado aqui como guarda client-side adicional
//     (a Tarefa permite qualquer uma das duas formas).
//   - `total` (linha) — `InputReadOnly`, `useEffect`: `(quantity × amount) −
//     discount`, arredondado 2c (CV-01) — só CAMPO CALCULADO, nunca editado
//     pelo usuário, por isso pode usar `useEffect` com segurança (mirror
//     `amountField` de `RequisitionItemRow`).
//
// Todos os botões usam `type="button"` EXPLÍCITO — dentro do `<form>` do
// pai, um `<button>` sem `type` default para `submit`.
//
// AJUSTE #4 (homologação do dono) — botão ÚNICO criar/editar Produto ao
// lado do select de cada linha, mirror EXATO do padrão já consolidado em
// `CreateOrUpdateMovimento.tsx` (Cliente/Fornecedor) e
// `ContratosVenda/CreateOrUpdateContratoVenda.tsx` (Produto, TASK-FE-036-B16
// — MESMO `ProductFormModal` genérico, zero endpoint/schema/service novo,
// zero form reimplementado). Ícone condicional `FiPlus` (campo vazio) /
// `FiEdit` (produto já selecionado); `useDisclosure` + `cacheUniqs` NO
// NÍVEL DA LINHA (não do editor) — cada linha do `useFieldArray` abre seu
// próprio modal e força reler sua própria página 1 do
// `SelectAsyncPaginate`, sem vazar estado entre linhas. Pós-`onSaved`,
// reusa a MESMA cascata `handleProductChange` (unidade + `las_price`
// default, GAP-BG-FE-08) que já roda no `onChange` manual do select — o
// produto criado/editado pelo modal fica indistinguível de um produto
// escolhido pelo dropdown.
// -----------------------------------------------------------------------------

import { ElementType, useCallback, useEffect, useRef, useState } from 'react';

import { Box, Flex, Icon, IconButton, Text, useDisclosure } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useController,
  useWatch,
} from 'react-hook-form';
import { FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';

import { ProductFormModal } from '@/pages/CadastrosBase/Produtos/Catalogo/ProductFormModal';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { usePermissions } from '@/hooks/usePermissions';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import { categoryProductType } from '@/constants/CategoryProducts/category-product-type';

import { getProduct, listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';

import type { LanguageDate } from '@/@types/language';
import type { BudgetForm, BudgetItemForm } from '@/@types/v2/Budgets';

import type { ProductFormModalSavedPayload } from '@/pages/CadastrosBase/Produtos/Catalogo/ProductFormModal';

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

export interface BudgetItemsFieldValues {
  items: BudgetItemForm[];
}

export interface BudgetItemsEditorProps {
  /** `control` do `useForm` do formulário PAI (`BudgetForm`, TASK-BG-FE-03). */
  control: Control<BudgetForm>;
  /** `fields` do `useFieldArray({ control, name: 'items' })` do PAI. */
  fields: FieldArrayWithId<BudgetItemsFieldValues, 'items', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<BudgetItemsFieldValues, 'items'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<BudgetForm>;
  languageGB: LanguageDate;
  /** Gate de permissão do formulário PAI — opcional, default habilitado. */
  disabled?: boolean;
}

interface BudgetItemRowProps {
  control: Control<BudgetItemsFieldValues>;
  index: number;
  remove: UseFieldArrayRemove;
  languageGB: LanguageDate;
  disabled: boolean;
}

function mapProductOption(item: ProductOptionItem) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

/**
 * Shape default de uma linha de item NOVA (mesmo objeto usado pelo botão
 * "Adicionar Item +", `handleAdd` abaixo). Exportada para o formulário PAI
 * (`CreateOrUpdateBudget.tsx`) reusar SEM duplicar a shape — AJUSTE #3
 * (homologação do dono): modo CREATE já nasce com 1 linha vazia, já que o
 * mínimo de 1 item é obrigatório de qualquer forma.
 *
 * @return {BudgetItemForm} Objeto vazio, pronto para `append`/`defaultValues`.
 */
export function createEmptyBudgetItem(): BudgetItemForm {
  return {
    product: null,
    unit: '',
    quantity: '',
    amount: '',
    discount: 0,
    total: 0,
  };
}

function BudgetItemRow({ control, index, remove, languageGB, disabled }: BudgetItemRowProps) {
  const text = languageGB.budgets.budget;
  const itemText = text.form.fields.item;
  const { can } = usePermissions();

  // AJUSTE #4 — modal de criar/editar Produto DESTA linha (1 disclosure +
  // 1 cache-key POR linha, mirror `clientModalDisclosure`/
  // `clientOptionsCacheKey` de `CreateOrUpdateMovimento.tsx`).
  const productModalDisclosure = useDisclosure();
  const [productOptionsCacheKey, setProductOptionsCacheKey] = useState(0);

  // Cache local (`uuid` -> registro completo do `ProductOptionItem`) — mesmo
  // racional de `stockCacheRef` em `RequisitionItemsEditor.tsx`: dado real da
  // MESMA resposta que popula o dropdown, sem endpoint novo (só `unit`, que
  // o Options-Resource já expõe via `measurement.description`).
  const productCacheRef = useRef(new Map<string, ProductOptionItem>());

  const { field: productField, fieldState: productFieldState } = useController({
    control,
    name: `items.${index}.product`,
  });
  const { field: unitField } = useController({ control, name: `items.${index}.unit` });
  const { field: quantityField, fieldState: quantityFieldState } = useController({
    control,
    name: `items.${index}.quantity`,
  });
  const { field: amountField, fieldState: amountFieldState } = useController({
    control,
    name: `items.${index}.amount`,
  });
  const { field: discountField, fieldState: discountFieldState } = useController({
    control,
    name: `items.${index}.discount`,
  });
  const { field: totalField } = useController({ control, name: `items.${index}.total` });

  const listRowProducts = useCallback(async (params: Parameters<typeof listProductOptions>[0]) => {
    const response = await listProductOptions({
      ...params,
      category_type: categoryProductType.production,
    });
    response.data.items.forEach((item) => productCacheRef.current.set(item.uuid, item));
    return response;
  }, []);

  const quantity = Number(quantityField.value) || 0;
  const amount = Number(amountField.value) || 0;
  const discount = Number(discountField.value) || 0;
  const lineTotal = roundTo2(quantity * amount - discount);

  // CV-01 — total da linha SEMPRE calculado, nunca editável — `useEffect` é
  // seguro aqui porque `total` não é um campo que o usuário edita (mirror
  // `amountField` de `RequisitionItemRow`).
  useEffect(() => {
    if (Number(totalField.value) !== lineTotal) {
      totalField.onChange(lineTotal);
    }
  }, [lineTotal]);

  // FLD-08/FLD-10 — cascata produto→unidade+valor unitário, IMPERATIVA (só
  // dispara no `change` do select, nunca via `useEffect` reativo) — fiel ao
  // "no change" do legado e ao Risco 1 da Tarefa (amount aceita edição
  // manual depois, sem ser sobrescrito por outro recálculo).
  async function handleProductChange(option: { label: string; value: string } | null) {
    productField.onChange(option ?? null);

    if (!option) {
      unitField.onChange('');
      return;
    }

    const cached = productCacheRef.current.get(option.value);
    if (cached) {
      unitField.onChange(cached.measurement?.description ?? '');
    }

    // GAP-BG-FE-08 (ver docblock do arquivo) — `las_price` não vem no
    // Options-Resource; busca o produto completo sob demanda, sem fabricar
    // o valor. Falha na busca degrada honestamente (amount permanece como
    // estava, usuário preenche manualmente) — nunca lança/bloqueia a linha.
    try {
      const product = await getProduct(option.value);
      amountField.onChange(product.data.las_price ?? 0);
      // AJUSTE #4 — quando o produto vem do `ProductFormModal` (recém
      // criado/editado), ele ainda não está no cache local do dropdown
      // (populado só pelas páginas já lidas de `listRowProducts`); usa a
      // MESMA resposta de `getProduct` acima para preencher `unit`, sem
      // 2º request e sem deixar o campo vazio.
      if (!cached) {
        unitField.onChange(product.data.measurement?.description ?? '');
      }
    } catch {
      // Degradação honesta — sem toast (não é erro do usuário, é só a
      // ausência do default automático); `amount` continua editável.
    }
  }

  // AJUSTE #4 — pós-`onSaved` do `ProductFormModal`: reusa a MESMA cascata
  // manual do select (`handleProductChange`) para que o produto
  // criado/editado fique 100% equivalente a um produto escolhido no
  // dropdown (unidade + `las_price` default), e força a próxima abertura
  // do `SelectAsyncPaginate` a reler a página 1 (mirror
  // `setClientOptionsCacheKey` de `CreateOrUpdateMovimento.tsx`).
  async function handleProductSaved(product: ProductFormModalSavedPayload) {
    await handleProductChange({ label: product.label, value: product.uuid });
    setProductOptionsCacheKey((key) => key + 1);
  }

  return (
    <>
      <Flex gap={3} align="flex-start" wrap="wrap">
        <Flex flex="2" minW="240px" gap={2} align="flex-end">
          <Box flex={1}>
            <SelectAsyncPaginate
              name={productField.name}
              label={itemText.product}
              service={listRowProducts}
              mapOptions={mapProductOption}
              findParams={findParamsFromSearch}
              value={productField.value ?? null}
              onChange={handleProductChange as any}
              error={productFieldState.error?.message}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              isRequired
              isDisabled={disabled}
              // AJUSTE #4 — força reler a página 1 depois de criar/editar um
              // produto pelo modal ao lado (mirror `cacheUniqs` de
              // `CreateOrUpdateMovimento.tsx`/`CreateOrUpdateContratoVenda.tsx`).
              cacheUniqs={[productOptionsCacheKey]}
              // EST-07 — botão único criar/editar Produto migrado do
              // `IconButton` avulso para o `labelAction`, mirror EXATO do
              // padrão `CreateOrUpdateNfe.tsx`. Ícone condicional: `FiPlus`
              // com a linha vazia, `FiEdit` com produto já selecionado.
              labelActionTooltip={
                productField.value
                  ? text.form.actions.editProductAria
                  : text.form.actions.addProductAria
              }
              labelAction={
                <IconButton
                  aria-label={
                    productField.value
                      ? text.form.actions.editProductAria
                      : text.form.actions.addProductAria
                  }
                  variant="ghost"
                  size="2xs"
                  minH="0"
                  h="20px"
                  w="20px"
                  minW="0"
                  p="0"
                  disabled={disabled || !(can('products_create') || can('products_edit'))}
                  onClick={productModalDisclosure.onOpen}
                >
                  <Icon as={productField.value ? FiEdit : FiPlus} boxSize="16px" color="primaryMain" />
                </IconButton>
              }
            />
          </Box>
        </Flex>

        <Box w={{ base: 'full', sm: '110px' }}>
          <InputReadOnly
            name={unitField.name}
            label={itemText.unit}
            value={unitField.value || '—'}
          />
        </Box>

        <Box w={{ base: 'full', sm: '140px' }}>
          <NumberInput
            name={quantityField.name}
            label={itemText.quantity}
            allowDot
            decimalPlaces={4}
            min={0}
            value={quantity}
            onValueChange={(nextValue) => quantityField.onChange(nextValue ?? '')}
            disabled={disabled}
            error={quantityFieldState.error?.message}
          />
        </Box>

        {/* Risco 1 (Roteiro) — EDITÁVEL, diferente de Requisição (`value`
          sempre readonly). Preenchido por default no `handleProductChange`
          acima, mas nunca travado depois. */}
        <Box w={{ base: 'full', sm: '140px' }}>
          <NumberInput
            name={amountField.name}
            label={itemText.amount}
            allowDot
            decimalPlaces={4}
            min={0}
            value={amount}
            onValueChange={(nextValue) => amountField.onChange(nextValue ?? '')}
            disabled={disabled}
            error={amountFieldState.error?.message}
          />
        </Box>

        <Box w={{ base: 'full', sm: '130px' }}>
          <MoneyInput
            name={discountField.name}
            label={itemText.discount}
            value={discountField.value ?? 0}
            onValueChange={(nextValue) => discountField.onChange(nextValue)}
            disabled={disabled}
            error={discountFieldState.error?.message}
          />
        </Box>

        <Box w={{ base: 'full', sm: '140px' }}>
          <InputReadOnly
            name={totalField.name}
            label={itemText.total}
            value={formatCurrencyBRL(lineTotal)}
          />
        </Box>

        <Flex direction="column" gap="1.5">
          <Flex alignItems="center" fontSize="14px" visibility="hidden">
            {itemText.removeItem}
          </Flex>
          <IconButtonTable
            type="button"
            aria-label={itemText.removeItem}
            mensegerTooltip={itemText.removeItem}
            size="sm"
            color="red.500"
            variant="ghost"
            disabled={disabled}
            onClick={() => remove(index)}
          >
            <Icon as={FiTrash2} />
          </IconButtonTable>
        </Flex>
      </Flex>

      {/* AJUSTE #4 — modal de criar/editar Produto DESTA linha. `productUuid`
          lido direto de `productField.value`, o modal sempre reflete o valor
          ATUAL do campo desta linha (mirror `ClientFormModal`/
          `ProductFormModal` de `CreateOrUpdateMovimento.tsx`/
          `CreateOrUpdateContratoVenda.tsx`). */}
      <ProductFormModal
        isOpen={productModalDisclosure.open}
        onClose={productModalDisclosure.onClose}
        productUuid={productField.value?.value}
        onSaved={handleProductSaved}
      />
    </>
  );
}

export function BudgetItemsEditor({
  control,
  fields,
  append,
  remove,
  errors,
  languageGB,
  disabled = false,
}: BudgetItemsEditorProps) {
  const text = languageGB.budgets.budget;
  const itemText = text.form.fields.item;

  // Cast local (não vaza na API pública) — mesmo racional do irmão
  // `RequisitionItemsEditor`.
  const genericControl = control as unknown as Control<BudgetItemsFieldValues>;

  const arrayError = (errors as any)?.items?.message as string | undefined;

  const watchedItems = useWatch({ control: genericControl, name: 'items' }) ?? [];
  const grandTotal = watchedItems.reduce((sum, item) => {
    const quantity = Number(item?.quantity) || 0;
    const amount = Number(item?.amount) || 0;
    const discount = Number(item?.discount) || 0;
    return sum + roundTo2(quantity * amount - discount);
  }, 0);

  function handleAdd() {
    append(createEmptyBudgetItem());
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {itemText.sectionTitle}
        </Text>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.form.fields.footer.subtotal}:
          </Text>
          <Text fontSize="sm" fontWeight="semibold">
            {formatCurrencyBRL(roundTo2(grandTotal))}
          </Text>
        </Flex>
      </Flex>

      {arrayError && (
        <Box mb={4}>
          <Text fontSize="sm" color="fg.error">
            {arrayError}
          </Text>
        </Box>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || itemText.sectionTitle}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <BudgetItemRow
              key={field.id}
              control={genericControl}
              index={index}
              remove={remove}
              languageGB={languageGB}
              disabled={disabled}
            />
          ))}
        </Flex>
      )}

      <Button
        type="button"
        title={itemText.addItem}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default BudgetItemsEditor;
