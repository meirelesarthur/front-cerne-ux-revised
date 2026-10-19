// src/pages/Operacional/Carregamento/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Carregamentos — mirror `Operacional/Romaneios/
// HeaderTable.tsx` (versão sem busca numérica dedicada — o contrato de
// Carregamentos não tem campo de busca por código, só os 7 filtros do
// drawer, `ChargeIndexRequest::rules()`).
//
//   - 2 botões de Relatório PDF (TASK-FE-CG-07, mirror
//     `Operacional/Weaning/HeaderTable.tsx`) — "Relatório por Produto"
//     (gate `charge_product_report`) e "Conferência de Cargas" (gate
//     `charge_week_report`, mirror do relatório semanal). Permissões
//     DIFERENTES, mesmo componente genérico `ChargeReportModal`.
//   - "Adicionar" (`ButtonAdd`, gate `charge_create`) — navega para
//     `/operacional/carregamento/novo` (rota nasce em `TASK-FE-CG-03`).
//   - `ButtonFilter` (badge de contagem dos 7 filtros do drawer).
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import {
  downloadChargeReportByProduct,
  downloadChargeWeekReport,
} from '@/services/v2/Carregamentos/charge-report-service';

import type { LanguageDate } from '@/@types/language';

import { ChargeReportModal } from './ChargeReportModal';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.carregamentos.charge.reports;

  const canViewProductReport = can('charge_product_report');
  const canViewWeekReport = can('charge_week_report');

  const [isProductReportOpen, setIsProductReportOpen] = useState(false);
  const [isWeekReportOpen, setIsWeekReportOpen] = useState(false);

  return (
    <>
      {canViewProductReport && (
        <Button
          title={text.byProduct.headerButtonLabel}
          variant="outline"
          icon={FiFileText as ElementType}
          onClick={() => setIsProductReportOpen(true)}
        />
      )}
      {canViewWeekReport && (
        <Button
          title={text.week.headerButtonLabel}
          variant="outline"
          icon={FiFileText as ElementType}
          onClick={() => setIsWeekReportOpen(true)}
        />
      )}
      {can('charge_create') && (
        <ButtonAdd
          onClick={() => navigate('/operacional/carregamento/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />

      <ChargeReportModal
        isOpen={isProductReportOpen}
        onClose={() => setIsProductReportOpen(false)}
        title={text.byProduct.title}
        downloadFn={downloadChargeReportByProduct}
        filename="relatorio-carregamentos-por-produto.pdf"
        languageGB={languageGB}
      />
      <ChargeReportModal
        isOpen={isWeekReportOpen}
        onClose={() => setIsWeekReportOpen(false)}
        title={text.week.title}
        downloadFn={downloadChargeWeekReport}
        filename="relatorio-carregamentos-semanal.pdf"
        languageGB={languageGB}
      />
    </>
  );
}
