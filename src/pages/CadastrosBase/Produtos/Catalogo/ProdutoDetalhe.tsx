// src/pages/CadastrosBase/Produtos/Catalogo/ProdutoDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de um PRODUTO — Cadastros Base / Estrutura
// / "Catálogo" (`TASK-FE-505`, execução 025). Rota própria (wiring real de
// rota é `TASK-FE-506`, CHOKEPOINT, NÃO tocado aqui):
//   /cadastros-base/produtos/:productId/detalhe — permissão `products_view`
//   (URL renomeada de `/produtos/catalogo/...` em TASK-FE-1000), mesmo padrão
//   de rota dedicada de `/cadastros-base/safras/:harvestId/detalhe`
//   (`SafraDetalhe.tsx`).
//
// MIRROR declarado (precedência do agente fino — `get_spa_*`/`get_pwa_*` não
// estão no runtime desta sessão): `SafraDetalhe.tsx` (casca
// `FormContainer`+`headerActions`+`Skeleton`+`EmptyState` de 404, subtítulo
// montado manualmente por causa do bug já catalogado de `FormContainer.
// subtitle` nunca renderizar — ver nota daquele arquivo, não corrigido aqui,
// fora de `Arquivos Afetados`) + Referência UX real
// (`GB.Cerne.UX/.../ProdutoDetalhe.tsx`, componente separado do form, 2
// blocos "Identificação"/"Estoque e Financeiro", fallback "Não informado").
//
// Fiel ao Objetivo da Tarefa: MESMOS campos de `TASK-FE-503`/`504`
// (`CreateOrUpdateProduto.tsx`/`ProdutoEstoqueFinanceiroTab.tsx`), sem
// Controller/register/mutation — dado estático de `ProductData`
// (`useProductForm`, reaproveitado, mesmo hook do form). Rótulos de campo
// REAPROVEITAM `languageGB.products.product.form.fields`/`form.tabs` (mesma
// estrutura visual do form, só em modo leitura) — só os textos exclusivos de
// detalhe (subtítulo, "não informado", 404) entram em `product.detail`
// (aditivo em `module-products`, ver nota de rodapé do arquivo de idioma).
//
// SEM DELETE (contrato confirmado `->except(['destroy'])`) — nenhuma ação de
// excluir é renderizada. Botão "Editar" só com `can('products_edit')`.
//
// Embalagens (`packages`, M2M, `TASK-BE-506`/`GAP-BE-230`) — dado que a
// listagem não mostra (task-packet desta Tarefa pede explicitamente).
// `ProductData.package_uuids` só traz uuids (Resource não aninha
// descrição/objeto, diferente das demais FKs) — os NOMES são resolvidos
// client-side via `usePackageOptionsList` (hook JÁ existente,
// `useProducts.tsx`, criado por `TASK-FE-504` para o `CheckboxListField` da
// Aba 2), mesmo catálogo tenant-scoped pequeno (161 linhas), sem GET extra
// dedicado a este componente.
//
// Guarda de fazenda ativa (`farm.context` ESTRITO, Product-contrato.md §8,
// mesmo o catálogo sendo tenant-wide) — mirror exato do guard já usado por
// `CreateOrUpdateProduto.tsx`: sem fazenda ativa, `EmptyState` informativo
// (reaproveita `list.noFarmSelected`) e ZERO chamada de rede (`useProductForm`/
// `usePackageOptionsList` recebem `enabled: hasFarm`, que já vira
// `registrationId: undefined`/`enabled: false` internamente).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import {
  Badge,
  Box,
  EmptyState,
  Flex,
  GridItem,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiBox, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import { ProductReadOnlyField } from './ProductReadOnlyField';
import { usePackageOptionsList, useProductForm } from './useProducts';

const PRODUCTS_LIST_ROUTE = '/cadastros-base/produtos';

// Formatação monetária pt-BR — mesma resolução local de poucas linhas já
// usada em `ProdutoEstoqueFinanceiroTab.tsx::formatCurrencyBRL` (Regra F:
// sem util global para um único consumidor real, arquivo irmão não é tocado
// aqui, por isso a função é replicada localmente, não importada).
function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumberPtBr(value: number): string {
  return value.toLocaleString('pt-BR');
}

// Campo de leitura booleana (label + Badge Sim/Não) — adaptação do
// `yesNo`/`DetailGrid` da Referência UX para os componentes reais do fork
// (`Badge` do Chakra, mesmo padrão de cor de `SafraDetalhe.tsx`).
function BooleanField({
  label,
  value,
  loading,
}: {
  label: string;
  value: boolean;
  loading: boolean;
}) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={1}
      >
        {label}
      </Text>
      <Skeleton loading={loading} width="fit-content" borderRadius="md">
        <Badge colorPalette={value ? 'green' : 'gray'} variant="subtle" py={1} px={3}>
          {value ? 'Sim' : 'Não'}
        </Badge>
      </Skeleton>
    </Box>
  );
}

export default function ProdutoDetalhe() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can, hasFarm } = usePermissions();
  const text = languageGB.products.product;

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // (mesmo padrão de `SafraDetalhe.tsx`/`CreateOrUpdateProduto.tsx`):
  // redireciona para a listagem ANTES de renderizar qualquer conteúdo.
  useEffect(() => {
    if (!isValidGuid(productId)) {
      navigate(PRODUCTS_LIST_ROUTE, { replace: true });
    }
  }, [productId, navigate]);

  if (!isValidGuid(productId)) {
    return null;
  }

  // `fillForm` do hook compartilhado é irrelevante aqui (sem `useForm` nesta
  // tela, Objetivo da Tarefa) — no-op só para satisfazer a assinatura.
  const productQuery = useProductForm({
    registrationId: productId,
    fillForm: () => {},
    enabled: hasFarm,
  });
  const packageOptionsQuery = usePackageOptionsList(hasFarm);

  // Sem fazenda ativa: não há como resolver o registro (catálogo tenant-wide,
  // mas a rota exige X-Farm-Id, Product-contrato.md §8) — EmptyState
  // informativo em vez do conteúdo, zero chamada de rede (mesmo racional de
  // `CreateOrUpdateProduto.tsx`).
  if (!hasFarm) {
    return (
      <FormContainer title={text.singularLabel}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiBox} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{text.list.noFarmSelected.title}</EmptyState.Title>
                <EmptyState.Description>
                  {text.list.noFarmSelected.description}
                </EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const isLoading = checkLoadingStatus([productQuery as any]);
  const product = productQuery.data;
  // `useProductForm`/`useCustomFormQueryByGuid` tipa o retorno como
  // `Response<TData>` (sem `isError`/`isLoading`) embora o objeto real em
  // runtime seja o `UseQueryResult` do react-query — mesma divergência já
  // contornada com `as any` em `checkLoadingStatus` acima e em
  // `CreateOrUpdateProduto.tsx` (`isLoading = ... checkLoadingStatus([productQuery as any])`).
  // Não corrigido aqui (fora de `Arquivos Afetados` desta Tarefa — o hook é
  // de `TASK-FE-500`, reaproveitado, não reescrito).
  const notFound = !isLoading && (productQuery as any).isError;
  const canEdit = can('products_edit');

  if (notFound) {
    return (
      <FormContainer title={text.singularLabel}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{text.detail.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{text.detail.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={text.detail.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                onClick={() => navigate(PRODUCTS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const notInformed = text.detail.notInformed;

  // Nomes das embalagens vinculadas (`package_uuids` → uuid cru, Resource não
  // aninha descrição) — resolvidos client-side contra o catálogo completo já
  // carregado por `usePackageOptionsList` (mesmo hook de
  // `ProdutoEstoqueFinanceiroTab.tsx`, sem GET dedicado).
  const packageUuids = product?.package_uuids ?? [];
  const packageNames = packageUuids.map(
    (uuid) => packageOptionsQuery.data?.find((item) => item.uuid === uuid)?.description ?? uuid
  );
  const packagesLoading = isLoading || (packageUuids.length > 0 && packageOptionsQuery.isLoading);

  return (
    <FormContainer
      title={product?.description ?? text.singularLabel}
      headerActions={
        product && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Badge
              colorPalette={product.is_enabled ? 'green' : 'gray'}
              variant="subtle"
              py={1}
              px={3}
            >
              {product.is_enabled ? text.list.table.activeLabel : text.list.table.inactiveLabel}
            </Badge>
            {canEdit && (
              <Button
                title={text.list.actions.edit}
                icon={FiEdit as ElementType}
                onClick={() => navigate(`${PRODUCTS_LIST_ROUTE}/${productId}`)}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        {/* Subtítulo — `FormContainer.subtitle` não renderiza (achado
            catalogado em `SafraDetalhe.tsx`), montado aqui como conteúdo
            normal. */}
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {text.detail.subtitlePrefix} {product?.code ?? ''} ·{' '}
            {product?.group.description ?? notInformed}
          </Text>
        </Skeleton>

        <Flex direction="column" gap={6} mt={6}>
          {/* ---- Bloco 1 — "Identificação" (mirror Aba 1, TASK-FE-503) ---- */}
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
              {text.form.tabs.identification}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <ProductReadOnlyField
                label={text.form.fields.description}
                value={product?.description ?? ''}
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.code}
                value={product?.code ?? ''}
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.measurement}
                value={product?.measurement.description ?? notInformed}
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.group}
                value={product?.group.description ?? notInformed}
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.category}
                value={product?.category.description ?? notInformed}
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.kind}
                value={product?.kind?.description ?? notInformed}
                loading={isLoading}
              />
              {/* `ncm` aninhado (`GAP-BE-660`, ✅ CONCLUÍDO) — `ncm_id` cru
                  não é mais exposto pelo `ProductResource` (Lei 10); mesmo
                  formato de label do Select em `CreateOrUpdateProduto.tsx`. */}
              {/* UT-000781: NCM em 2 colunas (lg) — preenche a sobra da linha e
                  segue o NCM largo do form; abaixo de lg, 1 coluna. */}
              <GridItem colSpan={{ base: 1, lg: 2 }}>
                <ProductReadOnlyField
                  label={text.form.fields.ncm}
                  value={
                    product?.ncm
                      ? product.ncm.code
                        ? `${product.ncm.code} — ${product.ncm.description}`
                        : product.ncm.description
                      : notInformed
                  }
                  loading={isLoading}
                />
              </GridItem>
            </SimpleGrid>
            <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
              <BooleanField
                label={text.form.fields.hasLot}
                value={!!product?.has_lot}
                loading={isLoading}
              />
              <BooleanField
                label={text.form.fields.isEquipment}
                value={!!product?.is_equipment}
                loading={isLoading}
              />
            </SimpleGrid>
          </Box>

          {/* ---- Bloco 2 — "Estoque e Financeiro" (mirror Aba 2, TASK-FE-504) ---- */}
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
              {text.form.tabs.stockFinancial}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <ProductReadOnlyField
                label={text.form.fields.minStock}
                value={
                  product?.min_stock !== null && product?.min_stock !== undefined
                    ? formatNumberPtBr(product.min_stock)
                    : notInformed
                }
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.lasPrice}
                value={formatCurrencyBRL(product?.las_price ?? 0)}
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.averageCost}
                value={formatCurrencyBRL(product?.average_cost ?? 0)}
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.secondMeasurement}
                value={product?.measurement_second?.description ?? notInformed}
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.factorType}
                value={product?.factor_type?.label ?? notInformed}
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.factor}
                value={
                  product?.factor !== null && product?.factor !== undefined
                    ? formatNumberPtBr(product.factor)
                    : notInformed
                }
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.activePrinciple}
                value={product?.active_principle ?? notInformed}
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.financialCategory}
                value={product?.financial_category?.description ?? notInformed}
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.defaultWarehouse}
                value={product?.default_warehouse?.description ?? notInformed}
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.defaultCostCenter}
                value={
                  product?.default_cost_center
                    ? `${product.default_cost_center.code} — ${product.default_cost_center.description}`
                    : notInformed
                }
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.addressing}
                value={product?.addressing?.description ?? notInformed}
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.taxRule}
                value={product?.tax_rule?.description ?? notInformed}
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.cultivation}
                value={product?.cultivation?.description ?? notInformed}
                loading={isLoading}
              />
              <ProductReadOnlyField
                label={text.form.fields.quality}
                value={product?.quality ?? notInformed}
                loading={isLoading}
              />
            </SimpleGrid>
            <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
              <BooleanField
                label={text.form.fields.controlStock}
                value={!!product?.control_stock}
                loading={isLoading}
              />
            </SimpleGrid>

            {/* Embalagens (`packages`, M2M) — pedido explícito do task-packet,
                dado que a listagem não mostra. */}
            <Box mt={6}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="wide"
                mb={2}
              >
                {text.form.fields.packages}
              </Text>
              <Skeleton loading={packagesLoading}>
                {packageNames.length > 0 ? (
                  <Flex wrap="wrap" gap={2}>
                    {packageNames.map((name, index) => (
                      <Badge
                        key={`${name}-${index}`}
                        colorPalette="gray"
                        variant="subtle"
                        py={1}
                        px={3}
                      >
                        {name}
                      </Badge>
                    ))}
                  </Flex>
                ) : (
                  <Text fontSize="sm" color="fg.muted">
                    {text.detail.packagesEmpty}
                  </Text>
                )}
              </Skeleton>
            </Box>
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
