// src/pages/Operacional/Rastreabilidade/Traceability/TraceabilityActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Produtos (Rastreabilidade) — mirror
// `Operacional/Carregamento/ChargeActionsMenu.tsx` (composição fina sobre
// `Actions`/`Actions.Item`). TASK-TR-FE-05.
//
// `action_manifest` do contrato legado (AM-01..06, `## 4.1` do contrato de
// tela) — 1 ação de header ("Novo", gate `traceab_create`, vive em
// `HeaderTable.tsx`) + as ações DE LINHA cobertas aqui:
//   - "Ver" (AM-02)      — rastreio público, rota EXTERNA, "sem @can (visível
//                          a quem já vê a listagem)" — a permissão
//                          `traceab_view` já é exigida pela ROTA da própria
//                          listagem (guarda fora do escopo desta Tarefa,
//                          mirror `Monitoring/index.tsx` não rechecando a
//                          permissão de tela dentro do menu). Por isso não
//                          recebe prop de gate própria.
//   - "Editar" (AM-03)   — gate `traceab_edit`. Sem "visualizar" interna
//                          alternativa: o contrato legado (`MM-03`) confirma
//                          que NUNCA existiu `show()` — o efetivo "visualizar"
//                          é a própria listagem + o link "Ver" externo.
//   - "Excluir" (AM-04)  — gate `traceab_delete`, confirmação no `index.tsx`
//                          (`DeleteConfirmDialog`, mirror `IG-10`).
//   - "Galeria" (AM-05)  — sem gate adicional (RT-08, `## 4.3` do contrato de
//                          tela).
//   - "Etiqueta" ×3 (AM-06, TASK-TR-FE-08) — PT/EN/ES, sem gate adicional
//                          (RT-11, `## 4.4`). Cada clique baixa o PDF (blob) e
//                          abre em nova aba — a mutação/fetch vive em
//                          `index.tsx` (`handleOpenTag`), este componente só
//                          dispara o callback e exibe o estado de loading
//                          (`Spinner` no lugar do ícone do idioma em
//                          download — `get_spa_ux_fidelity_pattern §3`,
//                          "loading" é estado de UI obrigatório).
// -----------------------------------------------------------------------------

import { Icon, Spinner } from '@chakra-ui/react';
import { FiEdit, FiExternalLink, FiFileText, FiImage, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

import type { TraceabilityTagLang } from '@/services/v2/Rastreabilidade/traceability-service';

export interface TraceabilityActionsMenuLabels {
  view: string;
  edit: string;
  delete: string;
  gallery: string;
  tagPt: string;
  tagEn: string;
  tagEs: string;
}

export interface TraceabilityActionsMenuProps {
  canEdit: boolean;
  canDelete: boolean;
  isDeleting?: boolean;
  /** Idioma da Etiqueta em download NESTA linha (single-flight por linha —
   *  `index.tsx` só preenche quando o `uuid` em download é o desta linha).
   *  `null`/`undefined` = nenhum download em curso nesta linha. Presente →
   *  as 3 entradas de Etiqueta ficam desabilitadas e a que corresponde ao
   *  idioma exibe `Spinner` no lugar do ícone (TASK-TR-FE-08). */
  tagDownloadingLang?: TraceabilityTagLang | null;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onGallery: () => void;
  onTagPt: () => void;
  onTagEn: () => void;
  onTagEs: () => void;
  labels: TraceabilityActionsMenuLabels;
}

export function TraceabilityActionsMenu({
  canEdit,
  canDelete,
  isDeleting = false,
  tagDownloadingLang = null,
  onView,
  onEdit,
  onDelete,
  onGallery,
  onTagPt,
  onTagEn,
  onTagEs,
  labels,
}: TraceabilityActionsMenuProps) {
  const isTagDownloading = tagDownloadingLang != null;

  return (
    <Actions size="sm">
      <Actions.Item icon={<Icon as={FiExternalLink} />} onClick={onView}>
        {labels.view}
      </Actions.Item>

      {canEdit && (
        <Actions.Item icon={<Icon as={FiEdit} />} onClick={onEdit}>
          {labels.edit}
        </Actions.Item>
      )}

      <Actions.Item icon={<Icon as={FiImage} />} onClick={onGallery}>
        {labels.gallery}
      </Actions.Item>

      <Actions.Item
        icon={tagDownloadingLang === 'pt-br' ? <Spinner size="xs" /> : <Icon as={FiFileText} />}
        onClick={onTagPt}
        disabled={isTagDownloading}
      >
        {labels.tagPt}
      </Actions.Item>
      <Actions.Item
        icon={tagDownloadingLang === 'en' ? <Spinner size="xs" /> : <Icon as={FiFileText} />}
        onClick={onTagEn}
        disabled={isTagDownloading}
      >
        {labels.tagEn}
      </Actions.Item>
      <Actions.Item
        icon={tagDownloadingLang === 'es' ? <Spinner size="xs" /> : <Icon as={FiFileText} />}
        onClick={onTagEs}
        disabled={isTagDownloading}
      >
        {labels.tagEs}
      </Actions.Item>

      {canDelete && (
        <>
          <Actions.Separator />
          <Actions.Item
            icon={<Icon as={FiTrash2} />}
            tone="danger"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {labels.delete}
          </Actions.Item>
        </>
      )}
    </Actions>
  );
}
