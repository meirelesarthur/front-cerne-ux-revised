// src/pages/Dashboards/FinancialDashboard/blocks/PagamentosRecebimentosAtrasados.tsx
// Bloco "Pagamentos e recebimentos atrasados" (`S-KPI-01/02`, `AM-002/003`)
// — 2 KPIs (a pagar/a receber) + modal de detalhe. O modal consome
// `overdue.items` do MESMO payload do dashboard (sem 2º endpoint
// `get-delayed-analytics` separado — o contrato aprovado
// `CONTRATO-API-048-04` só publica 1 endpoint; o rascunho do ROTEIRO
// §"Hooks" citava um 2º endpoint que não faz parte do contrato final).

import { useState } from 'react';

import { Box, Table, Text } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { DashboardCard, DashboardRow } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { FinancialOverdue } from '@/@types/v2/Dashboards/financialDashboard';

interface PagamentosRecebimentosAtrasadosProps {
  data: FinancialOverdue;
}

export function PagamentosRecebimentosAtrasados({ data }: PagamentosRecebimentosAtrasadosProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.financialDashboard.overdue;
  const commonText = languageGB.dashboards.common;

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <DashboardCard
      title={text.title}
      action={
        data.items.length > 0 ? (
          <Button
            title={text.detailsAction}
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          />
        ) : undefined
      }
    >
      <DashboardRow>
        <DashboardCard
          flex={1}
          minWidth={140}
          tone={data.payable_total > 0 ? 'warning' : 'default'}
        >
          <Text fontSize="xs" color="cardTextSecondary" marginBottom="1">
            {text.payable}
          </Text>
          <Text fontSize="xl" fontWeight="bold" color="cardTextPrimary">
            {formatCurrencyBRL(data.payable_total)}
          </Text>
        </DashboardCard>
        <DashboardCard
          flex={1}
          minWidth={140}
          tone={data.receivable_total > 0 ? 'warning' : 'default'}
        >
          <Text fontSize="xs" color="cardTextSecondary" marginBottom="1">
            {text.receivable}
          </Text>
          <Text fontSize="xl" fontWeight="bold" color="cardTextPrimary">
            {formatCurrencyBRL(data.receivable_total)}
          </Text>
        </DashboardCard>
      </DashboardRow>

      <CustomDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={text.modalTitle}
        maxW="640px"
        scrollableBody
      >
        {data.items.length === 0 ? (
          <Text fontSize="sm" color="cardTextSecondary">
            {commonText.empty.title}
          </Text>
        ) : (
          // CORREÇÃO PÓS-HOMOLOGAÇÃO (048, 3ª rodada) — a descrição real pode
          // vir como um texto concatenado gigante (ex.: `NFCe:000039084
          // Serie:1 ...`), sem espaço para quebra "natural" em blocos curtos.
          // `tableLayout: 'fixed'` + largura fixa na coluna de descrição
          // fazem o navegador respeitar o limite da célula; `wordBreak:
          // 'break-word'` força a quebra mesmo sem espaço; `line-clamp`
          // (2 linhas + reticências) evita linha gigante esticando a altura
          // da tabela — texto completo continua acessível via `title`. `Box`
          // com `overflowX="auto"` é a rede de segurança: nunca estoura a
          // largura do modal, mesmo que algo escape das regras acima.
          <Box overflowX="auto" width="full">
            <Table.Root size="sm" style={{ tableLayout: 'fixed' }} width="full" minWidth="480px">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader width="38%">{text.columns.description}</Table.ColumnHeader>
                  <Table.ColumnHeader width="18%">{text.columns.dueDate}</Table.ColumnHeader>
                  <Table.ColumnHeader width="20%">{text.columns.type}</Table.ColumnHeader>
                  <Table.ColumnHeader width="24%" textAlign="right">
                    {text.columns.amount}
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.items.map((item) => (
                  <Table.Row key={item.uuid}>
                    <Table.Cell
                      title={item.description ?? undefined}
                      style={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.description ?? '—'}
                    </Table.Cell>
                    <Table.Cell whiteSpace="nowrap">{item.due_date}</Table.Cell>
                    <Table.Cell>
                      {item.type === 'income' ? text.typeIncome : text.typeExpense}
                    </Table.Cell>
                    <Table.Cell textAlign="right" fontVariantNumeric="tabular-nums">
                      {formatCurrencyBRL(item.amount)}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </CustomDialog>
    </DashboardCard>
  );
}
