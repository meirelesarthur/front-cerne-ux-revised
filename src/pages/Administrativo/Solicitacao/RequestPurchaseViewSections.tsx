// src/pages/Administrativo/Solicitacao/RequestPurchaseViewSections.tsx
// -----------------------------------------------------------------------------
// Seções EXTRAS da visualização da Solicitação (execução 081, T-081-FE-05;
// contrato LEGADO 03: FM do "Visualizar" e PR-E01/PR-E03, show.blade.php:27-484).
//
// Visual (25/11): cada seção virou uma ABA da visualização, depois de
// Itens/Anexos/Histórico/Cotações, e só aparece quando tem dado:
//   - Autorização: Autorizador, Data, Justificativa Final + Classificação (ou
//     "Não Classificado"), Venc. Financeiro, Duração e Observação Final;
//   - Recebimento (só status 8): Data e Observação;
//   - Rateio: tabela Categoria, Centro de Custo, Porcentagem;
//   - Sub Solicitações: tabela com link para cada uma.
// Responsável, Prioridade e Tipo já aparecem no topo da tela, e o "Mapa de
// Cotações" na aba Cotações: não se repetem aqui.
//
// Tudo vem do detalhe da API (`RequestPurchaseData`, T-081-API-04): nada é
// calculado nem inventado aqui; dado ausente aparece como "—". Somente leitura.
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SimpleTable, type SimpleTableColumn, type SimpleTableRow } from '@/components/ui/SimpleTable';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import { columnsForm } from '@/constants/coluns-form';

import type { RequestPurchaseData } from '@/@types/v2/RequestPurchases';

import { PURCHASE_ORDER_PROTOTYPE } from '@/config/v2/purchaseOrderPrototype';

import { PrototypeInvoicesPanel, PrototypePaymentPanel } from './prototype/PrototypeFinancePanels';
import { PrototypeGeneratedOrders } from './prototype/PrototypeGeneratedOrders';
import type { PrototypePurchaseOrder, PurchaseOrderPrototypeFields } from './prototype/prototypeFields';
import { classificationLabel, showReceiptSection } from './requestPurchaseViewRules';
import { RequestTabEmpty, RequestTabHeader } from './RequestTabParts';

const EMPTY = '—';

export type RequestPurchaseViewSection =
  | 'delivery'
  | 'payment'
  | 'invoices'
  | 'authorization'
  | 'receipt'
  | 'ratio'
  | 'children'
  | 'links';

/** Abas extras da visualização, na ordem de exibição, só as que têm dado. */
export function availableViewSections(data: RequestPurchaseData): RequestPurchaseViewSection[] {
  // PROTÓTIPO: aba Entrega (frete, destino, descarga) com dados de demonstração.
  // PROTÓTIPO (lote 4): abas Pagamento e Notas fiscais.
  const sections: RequestPurchaseViewSection[] = PURCHASE_ORDER_PROTOTYPE
    ? ['delivery', 'payment', 'invoices', 'authorization']
    : ['authorization'];
  if (showReceiptSection(data.status)) sections.push('receipt');
  if ((data.ratio ?? []).length > 0) sections.push('ratio');
  if (PURCHASE_ORDER_PROTOTYPE) {
    // PROTÓTIPO: "Vínculos" mostra a origem E as derivadas (no lugar de Sub Solicitações).
    // 26/11: também as Ordens de compra geradas por esta Solicitação.
    const generated = (data as RequestPurchaseData & PurchaseOrderPrototypeFields).generated_orders ?? [];
    if (data.parent || (data.children ?? []).length > 0 || generated.length > 0) sections.push('links');
  } else if ((data.children ?? []).length > 0) {
    sections.push('children');
  }
  return sections;
}

interface RequestPurchaseViewSectionsProps {
  data: RequestPurchaseData;
  section: RequestPurchaseViewSection;
}

export function RequestPurchaseViewSections({ data, section }: RequestPurchaseViewSectionsProps) {
  const { languageGB } = useLanguage();
  const labels = languageGB.requestPurchases.requestPurchase.form.viewSections;

  if (section === 'delivery') {
    const deliveryText = languageGB.requestPurchases.requestPurchase.form.prototype.delivery;
    const delivery = (data as RequestPurchaseData & PurchaseOrderPrototypeFields).delivery;
    return (
      <Box pt={4}>
        <RequestTabHeader title={deliveryText.tab} />
        {!delivery ? (
          <RequestTabEmpty>{deliveryText.empty}</RequestTabEmpty>
        ) : (
          <>
            <SimpleGrid columns={columnsForm.threeColumns} columnGap={5} rowGap={6}>
              <InputReadOnly
                label={deliveryText.freightType}
                value={delivery.freight_type === 'CIF' ? deliveryText.cif : deliveryText.fob}
              />
              <InputReadOnly label={deliveryText.carrier} value={delivery.carrier || EMPTY} />
              <InputReadOnly
                label={deliveryText.unloading}
                value={delivery.needs_unloading ? deliveryText.yes : deliveryText.no}
              />
            </SimpleGrid>
            <SimpleGrid columns={columnsForm.twoColumns} columnGap={5} rowGap={6} mt={6}>
              <InputReadOnly label={deliveryText.place} value={delivery.place} />
              <InputReadOnly label={deliveryText.note} value={delivery.note || EMPTY} />
            </SimpleGrid>
          </>
        )}
      </Box>
    );
  }

  if (section === 'payment') {
    return <PrototypePaymentPanel data={data as PrototypePurchaseOrder} />;
  }

  if (section === 'invoices') {
    return <PrototypeInvoicesPanel data={data as PrototypePurchaseOrder} />;
  }

  if (section === 'links') {
    const linksText = languageGB.requestPurchases.requestPurchase.form.prototype.links;
    const linkColumns: SimpleTableColumn[] = [
      { key: 'code', header: linksText.code },
      { key: 'justification', header: linksText.justification },
    ];
    const toRow = (ref: { uuid: string; code?: string | null; justification?: string | null }) => ({
      key: ref.uuid,
      cells: {
        code: (
          <Link to={`/administrativo/solicitacao/${ref.uuid}/visualizar`}>
            <Text as="span" fontFamily="mono" color="primaryMain" textDecoration="underline">
              {ref.code ?? EMPTY}
            </Text>
          </Link>
        ),
        justification: ref.justification ?? EMPTY,
      },
    });
    const derived = data.children ?? [];
    return (
      <Box pt={4}>
        <RequestTabHeader title={linksText.origin} />
        {data.parent ? (
          <SimpleTable columns={linkColumns} rows={[toRow(data.parent)]} ariaLabel={linksText.origin} />
        ) : (
          <RequestTabEmpty>{linksText.noOrigin}</RequestTabEmpty>
        )}
        <Box mt={6}>
          <RequestTabHeader title={linksText.derived} count={derived.length} />
          {derived.length ? (
            <SimpleTable columns={linkColumns} rows={derived.map(toRow)} ariaLabel={linksText.derived} />
          ) : (
            <RequestTabEmpty>{linksText.noDerived}</RequestTabEmpty>
          )}
        </Box>
        <PrototypeGeneratedOrders data={data as PrototypePurchaseOrder} />
      </Box>
    );
  }

  if (section === 'authorization') {
    return (
      <Box pt={4}>
        <RequestTabHeader title={labels.authorizationTitle} />
        <SimpleGrid columns={columnsForm.threeColumns} columnGap={5} rowGap={6}>
          <InputReadOnly label={labels.authorizer} value={data.authorizer?.name || EMPTY} />
          <InputReadOnly
            label={labels.authorizationDate}
            value={data.authorization_date ? formatDate(data.authorization_date) : EMPTY}
          />
          <InputReadOnly
            label={labels.classification}
            value={classificationLabel(data.classification, labels.classificationOptions)}
          />
          <InputReadOnly
            label={labels.financialDueDate}
            value={data.financial_due_date ? formatDate(data.financial_due_date) : EMPTY}
          />
          <InputReadOnly label={labels.duration} value={data.duration_label || EMPTY} />
        </SimpleGrid>
        <SimpleGrid columns={columnsForm.twoColumns} columnGap={5} rowGap={6} mt={6}>
          <InputReadOnly
            label={labels.finalJustification}
            value={data.final_justification || EMPTY}
          />
          <InputReadOnly label={labels.finalizationNote} value={data.finalization_note || EMPTY} />
        </SimpleGrid>
      </Box>
    );
  }

  if (section === 'receipt') {
    return (
      <Box pt={4}>
        <RequestTabHeader title={labels.receiptTitle} />
        <SimpleGrid columns={columnsForm.twoColumns} columnGap={5} rowGap={6}>
          <InputReadOnly
            label={labels.receiptDate}
            value={data.receipt_date ? formatDate(data.receipt_date) : EMPTY}
          />
          <InputReadOnly label={labels.receiptNote} value={data.receipt_note || EMPTY} />
        </SimpleGrid>
      </Box>
    );
  }

  if (section === 'ratio') {
    const ratio = data.ratio ?? [];
    const columns: SimpleTableColumn[] = [
      { key: 'category', header: labels.ratioCategory },
      { key: 'center', header: labels.ratioCenter },
      { key: 'percent', header: labels.ratioPercent, align: 'right' },
    ];
    const rows: SimpleTableRow[] = ratio.map((row, index) => ({
      key: `${row.category?.uuid ?? 'c'}-${row.center?.uuid ?? 'x'}-${index}`,
      cells: {
        category: row.category?.description ?? EMPTY,
        center: row.center?.description ?? EMPTY,
        percent: `${Number(row.percent).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`,
      },
    }));
    return (
      <Box pt={4}>
        <RequestTabHeader title={labels.ratioTitle} count={ratio.length} />
        <SimpleTable columns={columns} rows={rows} ariaLabel={labels.ratioTitle} />
      </Box>
    );
  }

  const children = data.children ?? [];
  const columns: SimpleTableColumn[] = [
    { key: 'code', header: languageGB.requestPurchases.requestPurchase.form.fields.code },
    { key: 'justification', header: languageGB.requestPurchases.requestPurchase.form.fields.justification },
  ];
  const rows: SimpleTableRow[] = children.map((child) => ({
    key: child.uuid,
    cells: {
      code: (
        <Link to={`/administrativo/solicitacao/${child.uuid}/visualizar`}>
          <Text as="span" fontFamily="mono" color="primaryMain" textDecoration="underline">
            {child.code ?? EMPTY}
          </Text>
        </Link>
      ),
      justification: child.justification ?? EMPTY,
    },
  }));
  return (
    <Box pt={4}>
      <RequestTabHeader title={labels.childrenTitle} count={children.length} />
      <SimpleTable columns={columns} rows={rows} ariaLabel={labels.childrenTitle} />
    </Box>
  );
}
