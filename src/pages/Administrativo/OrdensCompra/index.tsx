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
// - Próximo passo, no backend: `scope` e `status[]` no `GET /request-purchases`,
//   `allowed_actions` e contagem por visão (pílula da aba). Ver
//   docs/ux/funcionalidades/ordem-de-compra-unica-e-tipos-de-servico.md §3.
// -----------------------------------------------------------------------------

import { type ComponentType, type LazyExoticComponent, Suspense, lazy, useMemo } from 'react';

import { Box, Flex, Spinner } from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';

import { ContainerGrid } from '@/components/ContainerGrid';
import { EmbeddedListProvider } from '@/components/EmbeddedList';
import { PageHeader } from '@/components/ui/PageHeader';
import { QueueTabs } from '@/components/ui/QueueTabs';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import {
  type PurchaseOrderViewKey,
  VIEW_PARAM,
  resolvePurchaseOrderView,
  visiblePurchaseOrderViews,
} from './purchaseOrderViews';

const VIEW_COMPONENTS: Record<PurchaseOrderViewKey, LazyExoticComponent<ComponentType>> = {
  minhas: lazy(() => import('@/pages/Administrativo/Solicitacao')),
  responsabilidade: lazy(() => import('@/pages/Administrativo/MeusProcessos')),
  aprovar: lazy(() => import('@/pages/Administrativo/Autorizacao')),
  cotacao: lazy(() => import('@/pages/Administrativo/Cotacoes')),
  compra: lazy(() => import('@/pages/Administrativo/Compras')),
  recebimento: lazy(() => import('@/pages/Administrativo/Recebimentos')),
  encerradas: lazy(() => import('@/pages/Administrativo/Rejeitados')),
};

export default function OrdensCompraHub() {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.hub;
  const { can } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const visible = useMemo(() => visiblePurchaseOrderViews(can), [can]);
  const active = resolvePurchaseOrderView(searchParams.get(VIEW_PARAM), visible);

  const tabs = useMemo(
    () => visible.map((view) => ({ key: view.key, label: text.views[view.key] })),
    [visible, text]
  );

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

      {active && (
        <Box mx={-3} mb={4}>
          <QueueTabs
            tabs={tabs}
            value={active}
            onChange={handleChangeView}
            ariaLabel={text.viewsAriaLabel}
          />
        </Box>
      )}

      <Box role="tabpanel" aria-label={active ? text.views[active] : undefined}>
        {ActiveList && (
          <EmbeddedListProvider>
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
