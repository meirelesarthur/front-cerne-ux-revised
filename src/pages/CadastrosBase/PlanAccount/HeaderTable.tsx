// src/pages/CadastrosBase/PlanAccount/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Plano de Contas (mesmo padrão de
// CentroCusto/HeaderTable.tsx).
//
// SÓ os botões de ação (adicionar / abrir filtro / Excel) — as colunas vivem
// no index.tsx. O botão "Nova Conta" respeita SOMENTE `plan-accounts_create`
// — diferente de CentroCusto, NÃO há a exceção `hasRole('Gestor_Plataf')`
// (DEC-005/GAP-BE-032 é específica daquele módulo; `PlanAccountResource` não
// expõe `can_edit`/`can_delete`/`can_create_descendant` por item, então não
// há base contratual para replicar essa autorização por-item aqui — ver
// cabeçalho de `usePermissions.ts`).
//
// As rotas de formulário (`/novo`, `/:uuid`) ainda não existem neste momento
// (são objeto da Tarefa irmã TASK-PA-03b) — navegar para elas cai no
// catch-all `/cadastros-base/*` (RoutePlaceholder "em construção"), sem
// quebrar a aplicação; mesma convenção já usada por outros itens do menu
// ainda não implementados.
//
// TASK-PA-07 acrescenta o menu `Actions` (reaproveitado do mesmo componente
// já usado nas ações de linha da grid, `index.tsx`) com 2 downloads
// síncronos via blob — "Baixar modelo" (`GET /plan-accounts/import/template`,
// sempre em branco) e "Exportar" (`GET /plan-accounts/export`, dados reais do
// tenant ativo). Sem TanStack mutation aqui (não há invalidação de cache
// nem estado de servidor a sincronizar) — só `useState` local por botão,
// mesmo racional documentado no Roteiro `ROTEIRO-02-planaccount-frontend-
// rework-ux-import-export`. Gate defensivo por `plan-accounts_view` (a rota
// já exige essa permissão para a tela existir, mas o projeto sempre confere
// `can()` por ação, não só por rota).
//
// TASK-PA-08 acrescenta o 3º item — "Importar" — que abre
// `PlanAccountImportModal` (máquina de estados própria, `useMutation` direto,
// não `useRequest`). Gate de permissão DUPLA (`plan-accounts_edit` E
// `plan-accounts_delete`, DEC-016 + `ImportPlanAccountRequest::authorize()`
// real do backend, TASK-PA-06) — diferente dos outros 2 itens (só
// `plan-accounts_view`), porque o import edita E apaga em massa.
//
// TASK-PA-10 acrescenta o botão "Saiba mais" — `Dialog` informativo 100%
// estático (Sintética/Analítica/Condição/Inativar), sem fetch/API, sem gate
// de negócio (só a mesma `plan-accounts_view` que a rota já exige). Primitivo
// `Dialog` do Chakra v3 (mesma composição de `@/components/DeleteConfirmDialog.tsx`).
//
// TASK-PA-12 acrescenta o ícone "Imprimir relatório" — Opção B aprovada em
// ROTEIRO-03/Achado 2: busca TODAS as páginas de `GET /plan-accounts`
// (`per_page=100`, laço sequencial, SEM aplicar o filtro atual da grid — fiel
// ao comportamento do UX), monta um documento HTML (`src/utils/planAccountReport.ts`)
// e dispara `window.print()` numa aba nova. Sem TanStack mutation (mesmo
// racional de download síncrono já usado em `TASK-PA-07`) — só `useState`
// local (`isGeneratingReport`) para o feedback de loading no ícone durante
// todo o laço. Erro de rede ou pop-up bloqueado abortam sem abrir relatório
// parcial (toasts distintos para cada caso).
//
// Ordem visual do header (fiel ao UX, `PlanoContasLista.tsx`): Saiba mais →
// Imprimir → menu Excel (`Actions`) → Adicionar Novo → Filtro.
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import { Dialog, Icon, Portal, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { FiDownload, FiFileText, FiHelpCircle, FiPrinter, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { usePermissions } from '@/hooks/usePermissions';
import { useTable } from '@/hooks/useTable';

import { downloadBlob } from '@/utils/downloadBlob';
import { openPlanAccountReport } from '@/utils/planAccountReport';

import {
  downloadPlanAccountImportTemplate,
  exportPlanAccounts,
  listAllPlanAccountsForReport,
} from '@/services/v2/PlanAccounts/plan-account-service';

import { LanguageDate } from '@/@types/language';

import { PlanAccountImportModal } from './PlanAccountImportModal';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { table } = useTable();
  const text = languageGB.planAccounts.planAccount;

  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Import (TASK-PA-08) — gate DUPLO (espelha `ImportPlanAccountRequest::
  // authorize()` real do backend: exige as DUAS permissões, não só uma).
  const canImport = can('plan-accounts_edit') && can('plan-accounts_delete');
  const {
    open: isImportModalOpen,
    onOpen: onOpenImportModal,
    onClose: onCloseImportModal,
  } = useDisclosure();

  // "Saiba mais" (TASK-PA-10) — modal informativo estático, sem query/mutation.
  const { open: isOpenHelp, onOpen: onOpenHelp, onClose: onCloseHelp } = useDisclosure();

  // "Imprimir relatório" (TASK-PA-12) — sem TanStack, 1 função async por clique.
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  async function handlePrintReport() {
    setIsGeneratingReport(true);
    try {
      const items = await listAllPlanAccountsForReport();
      const opened = openPlanAccountReport(items, {
        documentTitle: text.report.documentTitle,
        columnCode: text.list.table.code,
        columnClass: text.list.table.class,
        columnCondition: text.list.table.condition,
        columnDescription: text.list.table.description,
        metaCountSingular: text.report.metaCountSingular,
        metaCountPlural: text.report.metaCountPlural,
      });
      if (!opened) {
        toaster.error({ title: text.singularLabel, description: text.report.popupBlockedToast });
      }
    } catch {
      toaster.error({ title: text.singularLabel, description: text.report.errorToast });
    } finally {
      setIsGeneratingReport(false);
    }
  }

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);
    try {
      const blob = await downloadPlanAccountImportTemplate();
      downloadBlob(blob, 'modelo-plano-de-contas.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: text.excel.downloadTemplateError });
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await exportPlanAccounts();
      downloadBlob(blob, 'plano-de-contas.xlsx');
    } catch {
      toaster.error({ title: text.singularLabel, description: text.excel.exportError });
    } finally {
      setIsExporting(false);
    }
  }

  // Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/cadastros-base/plano-de-contas/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('plan-accounts_view') && (
        <Button
          variant="ghost"
          height="32px"
          title={text.list.helpButton}
          icon={FiHelpCircle as ElementType}
          onClick={onOpenHelp}
        />
      )}
      {can('plan-accounts_view') && (
        <IconButtonTable
          aria-label={text.report.tooltip}
          mensegerTooltip={text.report.tooltip}
          variant="outline"
          loading={isGeneratingReport}
          onClick={handlePrintReport}
        >
          <Icon as={FiPrinter} />
        </IconButtonTable>
      )}
      {can('plan-accounts_view') && (
        <Actions tooltipLabel={languageGB.defaltStrings?.actions}>
          <Actions.Item
            icon={<Icon as={FiDownload} />}
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
          >
            {text.excel.downloadTemplate}
          </Actions.Item>
          <Actions.Item
            icon={<Icon as={FiFileText} />}
            onClick={handleExport}
            disabled={isExporting}
          >
            {text.excel.export}
          </Actions.Item>
          {canImport && (
            <Actions.Item icon={<Icon as={FiUpload} />} onClick={onOpenImportModal}>
              {text.excel.import.menuLabel}
            </Actions.Item>
          )}
        </Actions>
      )}
      {can('plan-accounts_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/plano-de-contas/novo`)}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />

      <PlanAccountImportModal isOpen={isImportModalOpen} onClose={onCloseImportModal} />

      <Dialog.Root
        open={isOpenHelp}
        onOpenChange={(details: { open: boolean }) => {
          if (!details.open) onCloseHelp();
        }}
        lazyMount
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop />
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Positioner>
            {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
            <Dialog.Content>
              <Dialog.Header>
                {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
                <Dialog.Title>{text.list.helpTitle}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text mb={3}>{text.list.helpIntro}</Text>
                <VStack align="start" gap={2}>
                  <Text>
                    <Text as="span" fontWeight="bold">
                      {text.list.helpItems.synthetic.term}
                    </Text>{' '}
                    {text.list.helpItems.synthetic.description}
                  </Text>
                  <Text>
                    <Text as="span" fontWeight="bold">
                      {text.list.helpItems.analytical.term}
                    </Text>{' '}
                    {text.list.helpItems.analytical.description}
                  </Text>
                  <Text>
                    <Text as="span" fontWeight="bold">
                      {text.list.helpItems.condition.term}
                    </Text>{' '}
                    {text.list.helpItems.condition.description}
                  </Text>
                  <Text>
                    <Text as="span" fontWeight="bold">
                      {text.list.helpItems.deactivate.term}
                    </Text>{' '}
                    {text.list.helpItems.deactivate.description}
                  </Text>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button title={text.list.helpUnderstood} onClick={onCloseHelp} />
              </Dialog.Footer>
              {/* @ts-ignore ChakraUI v3 headless dialog */}
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
