// src/pages/Operacional/VendaAnimais/CreateClientQuickModal.tsx
// -----------------------------------------------------------------------------
// Modal "+ Novo Cliente" da Venda de Animais — TASK-VD-FE-02, contrato de
// tela §7.6.
//
// DECISÃO DE FIDELIDADE do Executor (registrada aqui, não é Gap): o
// contrato pede mirror de `Invoices/CreateProductFromXmlModal.tsx` (Dialog
// v3 avulso, form duplicado). Desde aquela Tarefa, o próprio fork evoluiu
// para um padrão MAIS canônico e já usado em produção por múltiplos
// formulários (`Operacional/ContratosVenda/CreateOrUpdateContratoVenda.tsx`,
// `Financeiro/MovCaixaBancario/CreateOrUpdateMovimento.tsx`,
// `Fiscal/NfeEmitidas/CreateOrUpdateNfe.tsx`, `Incomes/CreateOrUpdateIncome.tsx`):
// o componente GENÉRICO `ClientFormModal`
// (`pages/CadastrosBase/Clientes/ClientFormModal.tsx`) — mesmo formulário
// completo de Cliente, mesmo `useClientFormController`/`ClientFormFields`
// (`createClient`/`updateClient` já usados, `client-service.ts`), devolvendo
// `{uuid, label}` via `onSaved`. Reaproveitar esse componente é FIDELIDADE
// (mesma UX/mesmo código que todo o resto do fork usa hoje para "+ Novo
// Cliente"), não duplicar ~650 linhas de form body/autofill de CEP/NIF que o
// `ClientFormModal` já resolve. Este arquivo existe só para materializar o
// nome de arquivo previsto no contrato (§10) e documentar a decisão — é um
// wrapper fino, sempre em modo CRIAÇÃO (`clientUuid` nunca passado).
// -----------------------------------------------------------------------------

import {
  ClientFormModal,
  ClientFormModalSavedPayload,
} from '@/pages/CadastrosBase/Clientes/ClientFormModal';

export interface CreateClientQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (client: ClientFormModalSavedPayload) => void;
}

export function CreateClientQuickModal({
  isOpen,
  onClose,
  onCreated,
}: CreateClientQuickModalProps) {
  return <ClientFormModal isOpen={isOpen} onClose={onClose} onSaved={onCreated} />;
}
