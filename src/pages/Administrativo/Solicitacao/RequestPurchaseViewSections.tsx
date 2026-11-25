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

import { classificationLabel, showReceiptSection } from './requestPurchaseViewRules';
import { RequestTabHeader } from './RequestTabParts';

const EMPTY = '—';

export type RequestPurchaseViewSection = 'authorization' | 'receipt' | 'ratio' | 'children';

/** Abas extras da visualização, na ordem de exibição, só as que têm dado. */
export function availableViewSections(data: RequestPurchaseData): RequestPurchaseViewSection[] {
  const sections: RequestPurchaseViewSection[] = ['authorization'];
  if (showReceiptSection(data.status)) sections.push('receipt');
  if ((data.ratio ?? []).length > 0) sections.push('ratio');
  if ((data.children ?? []).length > 0) sections.push('children');
  return sections;
}

interface RequestPurchaseViewSectionsProps {
  data: RequestPurchaseData;
  section: RequestPurchaseViewSection;
}

export function RequestPurchaseViewSections({ data, section }: RequestPurchaseViewSectionsProps) {
  const { languageGB } = useLanguage();
  const labels = languageGB.requestPurchases.requestPurchase.form.viewSections;

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
