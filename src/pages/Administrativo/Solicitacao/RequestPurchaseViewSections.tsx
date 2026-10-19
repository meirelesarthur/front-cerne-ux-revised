// src/pages/Administrativo/Solicitacao/RequestPurchaseViewSections.tsx
// -----------------------------------------------------------------------------
// Seções EXTRAS da visualização da Solicitação (execução 081, T-081-FE-05;
// contrato LEGADO 03: FM do "Visualizar" e PR-E01/PR-E03, show.blade.php:27-484).
//
// Campos: Responsável Atual, Duração, Prioridade, Tipo, Classificação (ou "Não
// Classificado"), Venc. Financeiro e Observação Final. Seções: Autorização,
// Recebimento (só status 8), Sub Solicitações, Rateio (Categoria, Centro de
// Custo, Porcentagem) e Cotação Aprovada (botão "Mapa de Cotações").
//
// Tudo vem do detalhe da API (`RequestPurchaseData`, T-081-API-04): nada é
// calculado nem inventado aqui; dado ausente aparece como "—". Somente leitura.
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { QuotationsMapButton } from '@/components/Suprimentos/QuotationsMapButton';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import formatDate from '@/utils/formatDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { listRequestQuotationsByPurchase } from '@/services/v2/RequestQuotations/request-quotation-service';

import type { RequestPurchaseData } from '@/@types/v2/RequestPurchases';

import { classificationLabel, showReceiptSection } from './requestPurchaseViewRules';

const EMPTY = '—';

function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      mt={6}
      bg="bg.muted"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      p={4}
    >
      <Text fontSize="sm" fontWeight="semibold" mb={3}>
        {title}
      </Text>
      {children}
    </Box>
  );
}

interface RequestPurchaseViewSectionsProps {
  data: RequestPurchaseData;
  isLoading?: boolean;
}

export function RequestPurchaseViewSections({ data, isLoading }: RequestPurchaseViewSectionsProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const labels = languageGB.requestPurchases.requestPurchase.form.viewSections;

  const canSeeQuotations = can('request-quotation_view') || can('request-authorization_view');
  const quotationsQuery = useQuery({
    queryKey: [queryKey.requestQuotations.requestQuotationsByPurchase, data.uuid],
    queryFn: async () => (await listRequestQuotationsByPurchase(data.uuid)).data ?? [],
    enabled: !!data.uuid && canSeeQuotations,
  });
  const quotationsCount = quotationsQuery.data?.length ?? 0;

  const authorizerName = data.authorizer?.name || EMPTY;
  const children = data.children ?? [];
  const ratio = data.ratio ?? [];

  return (
    <>
      <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
        <InputReadOnly
          label={labels.responsible}
          value={data.responsible?.name ?? EMPTY}
          loading={isLoading}
        />
        <InputReadOnly label={labels.duration} value={data.duration_label || EMPTY} />
        <InputReadOnly label={labels.priority} value={data.priority_label || EMPTY} />
        <InputReadOnly label={labels.type} value={data.type_label || EMPTY} />
        <InputReadOnly
          label={labels.classification}
          value={classificationLabel(data.classification, labels.classificationOptions)}
        />
        <InputReadOnly
          label={labels.financialDueDate}
          value={data.financial_due_date ? formatDate(data.financial_due_date) : EMPTY}
        />
        <InputReadOnly label={labels.finalizationNote} value={data.finalization_note || EMPTY} />
      </SimpleGrid>

      <SectionBox title={labels.authorizationTitle}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <InputReadOnly label={labels.authorizer} value={authorizerName} />
          <InputReadOnly
            label={labels.authorizationDate}
            value={data.authorization_date ? formatDate(data.authorization_date) : EMPTY}
          />
          <InputReadOnly
            label={labels.finalJustification}
            value={data.final_justification || EMPTY}
          />
        </SimpleGrid>
      </SectionBox>

      {showReceiptSection(data.status) && (
        <SectionBox title={labels.receiptTitle}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <InputReadOnly
              label={labels.receiptDate}
              value={data.receipt_date ? formatDate(data.receipt_date) : EMPTY}
            />
            <InputReadOnly label={labels.receiptNote} value={data.receipt_note || EMPTY} />
          </SimpleGrid>
        </SectionBox>
      )}

      {quotationsCount > 0 && (
        <SectionBox title={labels.approvedQuotationTitle}>
          <Flex>
            <QuotationsMapButton
              requestPurchaseUuid={data.uuid}
              quotationsCount={quotationsCount}
            />
          </Flex>
        </SectionBox>
      )}

      {children.length > 0 && (
        <SectionBox title={labels.childrenTitle}>
          <Flex direction="column" gap={2}>
            {children.map((child) => (
              <Link key={child.uuid} to={`/administrativo/solicitacao/${child.uuid}/visualizar`}>
                <Text fontSize="sm" color="primaryMain" textDecoration="underline">
                  {child.code
                    ? `${child.code} — ${child.justification ?? ''}`
                    : child.justification}
                </Text>
              </Link>
            ))}
          </Flex>
        </SectionBox>
      )}

      {ratio.length > 0 && (
        <SectionBox title={labels.ratioTitle}>
          <Flex direction="column" gap={0}>
            <Flex gap={3} px={2} py={2} borderBottom="1px solid" borderColor="border.subtle">
              <Text flex="2" fontSize="xs" fontWeight="semibold" color="fg.muted">
                {labels.ratioCategory}
              </Text>
              <Text flex="2" fontSize="xs" fontWeight="semibold" color="fg.muted">
                {labels.ratioCenter}
              </Text>
              <Text w="110px" fontSize="xs" fontWeight="semibold" color="fg.muted">
                {labels.ratioPercent}
              </Text>
            </Flex>
            {ratio.map((row, index) => (
              <Flex
                key={`${row.category?.uuid ?? 'c'}-${row.center?.uuid ?? 'x'}-${index}`}
                gap={3}
                px={2}
                py={2}
                borderBottom="1px solid"
                borderColor="border.subtle"
              >
                <Text flex="2" fontSize="sm">
                  {row.category?.description ?? EMPTY}
                </Text>
                <Text flex="2" fontSize="sm">
                  {row.center?.description ?? EMPTY}
                </Text>
                <Text w="110px" fontSize="sm">
                  {`${Number(row.percent).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`}
                </Text>
              </Flex>
            ))}
          </Flex>
        </SectionBox>
      )}
    </>
  );
}
