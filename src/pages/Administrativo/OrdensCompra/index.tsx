// src/pages/Administrativo/OrdensCompra/index.tsx
// -----------------------------------------------------------------------------
// Tela única "Ordens de compra" (decisão do dono, 24/11/2026). As 7 listas de
// Suprimentos (Ordens de compra, Meus Processos, Autorização, Cotações, Compras,
// Recebimentos e Rejeitados) viram VISÕES de uma tela só, em abas.
//
// - Cada visão é a lista atual, embutida sem mudança (`EmbeddedListProvider`):
//   mesmo endpoint, mesma permissão, mesmas colunas, filtros e ações por linha.
//   Só o card e o título da lista somem; o título é o desta tela.
// - Só aparecem as visões que a pessoa pode ver (`purchaseOrderViews.ts`).
// - A visão aberta fica na URL (`?visao=compra`); os demais parâmetros (ex.:
//   `?search=` vindo do sino) seguem para a lista embutida.
// - As rotas antigas continuam vivas (links do sino, favoritos, app).
// - 25/11: as visões viraram um SELETOR único (`ViewSelect`: ícone + nome +
//   contador, menu com todas) no início da linha da busca; os botões da lista
//   e o "Novo" (fixo em toda visão) ficam na mesma linha (`EmbeddedList`).
//   Rejeitadas e Canceladas são visões separadas da mesma lista (situação
//   fixa). O contador é o total da própria lista (`usePurchaseOrderViewCounts`).
// - Próximo passo, no backend: `scope` e `status[]` no `GET /request-purchases`,
//   `allowed_actions` e contagem por visão (um pedido só). Ver
//   docs/ux/funcionalidades/ordem-de-compra-unica-e-tipos-de-servico.md §3.
// -----------------------------------------------------------------------------

import { type ComponentType, type LazyExoticComponent, Suspense, lazy, useMemo } from 'react';

import { Box, Flex, Spinner } from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ContainerGrid } from '@/components/ContainerGrid';
import { EmbeddedListProvider } from '@/components/EmbeddedList';
import { PageHeader } from '@/components/ui/PageHeader';
import { ViewSelect } from '@/components/ui/ViewSelect';

import type { IconName } from '@/design/icons';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import {
  type PurchaseOrderViewKey,
  VIEW_PARAM,
  resolvePurchaseOrderView,
  visiblePurchaseOrderViews,
} from './purchaseOrderViews';
import { usePurchaseOrderViewCounts } from './usePurchaseOrderViewCounts';

// Ícone de cada visão nas tags (papéis de `src/design/icons.ts`).
const VIEW_ICONS: Record<PurchaseOrderViewKey, IconName> = {
  todas: 'list',
  minhas: 'document-add',
  responsabilidade: 'user-check',
  aprovar: 'shield-check',
  cotacao: 'currency',
  compra: 'cart',
  recebimento: 'package-check',
  rejeitadas: 'error',
  canceladas: 'close',
};

const VIEW_COMPONENTS: Record<PurchaseOrderViewKey, LazyExoticComponent<ComponentType>> = {
  todas: lazy(() => import('@/pages/Administrativo/Solicitacao')),
  minhas: lazy(() => import('@/pages/Administrativo/Solicitacao')),
  responsabilidade: lazy(() => import('@/pages/Administrativo/MeusProcessos')),
  aprovar: lazy(() => import('@/pages/Administrativo/Autorizacao')),
  cotacao: lazy(() => import('@/pages/Administrativo/Cotacoes')),
  compra: lazy(() => import('@/pages/Administrativo/Compras')),
  recebimento: lazy(() => import('@/pages/Administrativo/Recebimentos')),
  rejeitadas: lazy(() => import('@/pages/Administrativo/Rejeitados')),
  canceladas: lazy(() => import('@/pages/Administrativo/Rejeitados')),
};

export default function OrdensCompraHub() {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.hub;
  const { can } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const visible = useMemo(() => visiblePurchaseOrderViews(can), [can]);
  const active = resolvePurchaseOrderView(searchParams.get(VIEW_PARAM), visible);

  const counts = usePurchaseOrderViewCounts(visible);
  const options = visible.map((view) => ({
    key: view.key,
    label: text.views[view.key],
    icon: VIEW_ICONS[view.key],
    count: counts[view.key],
  }));
  const activeView = visible.find((view) => view.key === active);

  function handleChangeView(key: PurchaseOrderViewKey) {
    // Troca de visão limpa os parâmetros da visão anterior (ex.: `?search=`).
    setSearchParams({ [VIEW_PARAM]: key });
  }

  const ActiveList = active ? VIEW_COMPONENTS[active] : undefined;

  return (
    <ContainerGrid>
      <Box mb={2}>
        <PageHeader title={text.pageTitle} description={text.pageSubtitle} />
      </Box>

      <Box role="tabpanel" aria-label={active ? text.views[active] : undefined}>
        {ActiveList && active && (
          <EmbeddedListProvider
            key={active}
            toolbarStart={
              <ViewSelect
                options={options}
                value={active}
                onChange={handleChangeView}
                ariaLabel={text.viewsAriaLabel}
              />
            }
            toolbarEnd={
              // "Novo" é da tela: fixo em qualquer visão (decisão do dono, 25/11).
              can('request-purchases_create') ? (
                <ButtonAdd
                  onClick={() => navigate('/administrativo/solicitacao/novo')}
                  languageGB={languageGB}
                />
              ) : undefined
            }
            fixedFilter={activeView?.fixedFilter}
          >
            <Suspense
              fallback={
                <Flex justify="center" py={10}>
                  <Spinner color="green.600" />
                </Flex>
              }
            >
              <ActiveList key={active} />
            </Suspense>
          </EmbeddedListProvider>
        )}
      </Box>
    </ContainerGrid>
  );
}
