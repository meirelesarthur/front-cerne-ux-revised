// src/pages/Administrativo/FuncionarioXEventos/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da Tela 1 (listagem-picker de Funcionários) — TASK-FE-FXE-01.
// Estrutura (contrato de tela §2):
//   - [REVISADO 2026-10-07, TASK-104 — supersede a revisão 2026-08-12/
//     TASK-FE-FXE-03/DA-EE-FE-02] Botão "Adicionar vínculo" (`Button` direto,
//     ícone `FiPlus`, gate `employeeevents_create`, variante SÓLIDA — não
//     `outline`, mirror da hierarquia visual do botão "Novo" do header legado
//     `employeeevents/index.blade.php`, único botão `btn-primary` enquanto os
//     demais eram `btn-info`/outline) — PRIMEIRO elemento do header. Não abre
//     mais `AdicionarVinculoModal` (removido, TASK-104 item 2 — fluxo volta a
//     ser PÁGINA ÚNICA sem modal, mirror fiel do legado): navega direto para
//     `/administrativo/func-eventos/novo`, onde `MatrizVinculosFuncionario`
//     (modo CRIAR) resolve a seleção de Funcionário inline.
//   - Botão "Importar planilha" (`Button` direto, ícone `FiUpload`, gate
//     `employeeevents_create`) — abre `FuncionarioEventoImportModal`, mirror
//     `CorrecaoEstoque/HeaderTable.tsx`.
//   - Botão "Relatório PDF" (`Button` direto, ícone `FiDownload`, gate
//     `employeeevents_view`) — download síncrono via blob, SEM filtro (1
//     clique, farm-wide), mirror `SaldoEstoqueRelatorio::handleExportPdf`.
//     `isExportingReport` é 1 dos poucos casos aceitáveis de estado local de
//     loading (mirror `isExportingPdf`).
//   - `ButtonFilter` (badge de contagem).
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { useDisclosure } from '@chakra-ui/react';
import { FiDownload, FiPlus, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { toaster } from '@/components/ui/toaster';

import { usePermissions } from '@/hooks/usePermissions';

import { downloadBlob } from '@/utils/downloadBlob';

import { exportEmployeeEventsReport } from '@/services/v2/EmployeeEvents/employee-event-service';

import { LanguageDate } from '@/@types/language';

import { FuncionarioEventoImportModal } from './FuncionarioEventoImportModal';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const { can } = usePermissions();
  const navigate = useNavigate();
  const text = languageGB.employeeEvents.employeeEvent;

  const {
    open: isImportModalOpen,
    onOpen: onOpenImportModal,
    onClose: onCloseImportModal,
  } = useDisclosure();

  const [isExportingReport, setIsExportingReport] = useState(false);

  async function handleExportReport() {
    setIsExportingReport(true);
    try {
      const blob = await exportEmployeeEventsReport();
      downloadBlob(blob, 'funcionario-eventos.pdf');
    } catch {
      toaster.error({
        title: text.reportButton.exportError.title,
        description: text.reportButton.exportError.description,
      });
    } finally {
      setIsExportingReport(false);
    }
  }

  return (
    <>
      {can('employeeevents_create') && (
        <Button
          title={text.addLinkButton}
          icon={FiPlus as ElementType}
          onClick={() => navigate('/administrativo/func-eventos/novo')}
        />
      )}
      {can('employeeevents_create') && (
        <Button
          title={text.importModal.menuButtonLabel}
          variant="outline"
          icon={FiUpload as ElementType}
          onClick={onOpenImportModal}
        />
      )}
      {can('employeeevents_view') && (
        <Button
          title={text.reportButton.label}
          variant="outline"
          icon={FiDownload as ElementType}
          onClick={handleExportReport}
          loading={isExportingReport}
          disabled={isExportingReport}
        />
      )}

      <FuncionarioEventoImportModal isOpen={isImportModalOpen} onClose={onCloseImportModal} />
    </>
  );
}
