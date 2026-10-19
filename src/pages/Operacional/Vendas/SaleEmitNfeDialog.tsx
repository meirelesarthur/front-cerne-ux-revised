// src/pages/Operacional/Vendas/SaleEmitNfeDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo de confirmação de "Emitir NFe" (HANDOFF) da Venda COMERCIAL (Sale
// — venda de PRODUTOS, Operacional / Vendas, 97-Esteiras/043,
// SALE-FE-COM-06, `S-SCREEN-007`/`S-FLOW-003`). Mirror EXATO de
// `Operacional/VendaAnimais/MovementSaleEmitNfeDialog.tsx` (já em produção).
//
// `GET /sales/{uuid}/nfe-draft` (A6) NÃO emite NFe nem grava `sale.nfe_id`
// — devolve só o payload de HANDOFF (`SaleNfeDraft`, mirror
// `BuildSaleNfeDraftAction`, sem sessão). GAP-043-SALE-FE-COM-02
// `[RESOLVIDO]`: modelo de HANDOFF — NÃO existe `POST /sales/{uuid}/
// nfe-emit`. O destino real é a navegação para `/fiscal/nfe-emitidas/novo`
// levando o draft em `location.state.saleHandoff` — mudança ADITIVA e
// OPCIONAL em `CreateOrUpdateNfe.tsx`: sem esse state, o form fiscal se
// comporta EXATAMENTE como hoje (zero regressão, provado pelo Tester). O
// vínculo `sale.nfe_id`/`status=Fechado` fica como follow-up
// (`FU-043-SALE-NFE-LINK`), fora do caminho crítico desta Tarefa.
//
// Condição "já tem NFe" (§7.2 `A006`) NÃO precisa de query própria — o
// `nfe` da linha já vem hidratado no `SaleListItem` consumido pela
// listagem (`SaleListResource`), então o caller (`index.tsx`) repassa
// `sale` inteiro e este diálogo só LÊ `sale.nfe`, sem round-trip extra.
//
// Gate duplo (`sales_view` + `nfe_create`) é responsabilidade do CALLER
// (`SaleActionsMenu.tsx`/`index.tsx`): este diálogo só abre quando o menu já
// concedeu as 2 permissões (item desabilitado com Tooltip quando falta
// `nfe_create`, nunca aqui dentro).
//
// `useSaleNfeDraft` é `useMutation` DIRETO (não `useRequest`) — nenhuma
// queryKey invalidada (nada persiste no servidor) e nenhum toast de sucesso
// formal (navegação imediata substitui o feedback). Erro tratado localmente
// via `mutate(uuid, { onError })`, toast manual (mesmo padrão de
// `MovementSaleEmitNfeDialog.tsx`).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import type { SaleListItem } from '@/@types/v2/Sales';

import { useSaleNfeDraft } from './useSales';

export interface SaleEmitNfeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleListItem | null;
}

export function SaleEmitNfeDialog({ isOpen, onClose, sale }: SaleEmitNfeDialogProps) {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const text = languageGB.sales.sale.nfeHandoff;

  const draftMutation = useSaleNfeDraft();

  function handleConfirm() {
    if (!sale) return;
    draftMutation.mutate(sale.uuid, {
      onSuccess: (response) => {
        onClose();
        // Handoff — mudança ADITIVA/OPCIONAL em `CreateOrUpdateNfe.tsx`:
        // navega para a CRIAÇÃO de NFe levando o draft.
        navigate('/fiscal/nfe-emitidas/novo', {
          state: { saleHandoff: response.data },
        });
      },
      onError: (error) => {
        toaster.error({
          title: languageGB.sales.sale.singularLabel,
          description: extractApiErrorMessage(error) ?? text.errorToast,
          duration: 7000,
        });
      },
    });
  }

  // §7.2 `A006` — `sale.nfe` já existe: estado INFORMATIVO bloqueado
  // (`DeleteConfirmDialog tone="info"`, `onConfirm=onClose`), equivalente
  // SPA do `ConfirmDialog tone="default"` do `cerne`. SEM dado fabricado —
  // a flag vem pronta do `SaleListResource`, nunca recalculada aqui.
  if (sale?.nfe) {
    return (
      <DeleteConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onClose}
        title={text.dialogTitle}
        description={languageGB.sales.sale.list.table.actions.generateNfeDisabledTooltip}
        hideQuestionMark
        confirmButtonText={languageGB.defaltStrings.close}
        tone="info"
        colorPalette="blue"
      />
    );
  }

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      isLoading={draftMutation.isPending}
      title={text.dialogTitle}
      description={text.dialogDescription}
      confirmButtonText={text.confirmButton}
      hideQuestionMark
      tone="info"
      colorPalette="blue"
    />
  );
}

export default SaleEmitNfeDialog;
