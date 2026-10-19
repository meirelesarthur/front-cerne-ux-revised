// src/@types/v2/EquipmentTransfers/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo TRANSFERÊNCIA DE MÁQUINAS (EquipmentTransfer) — API v1 do
// backend Laravel GB.Cerne, feature F-101, 97-Esteiras/005 (TASK-ETR-FE-01).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /equipment-transfers                → data: EquipmentTransferListItem[], meta REAL
//   GET    /equipment-transfers/{uuid}         → data: EquipmentTransferDetail
//   GET    /equipment-transfers/next-code      → data: { code } (DEC-FE-ETR-01, sem shape declarado)
//   GET    /equipment-transfers/destination-farms → data: EquipmentTransferRef[], SEM paginação
//   POST   /equipment-transfers                → multipart (create)
//   POST   /equipment-transfers/{uuid}/receive → multipart (receive)
//   DELETE /equipment-transfers/{uuid}         → 204 SEM CORPO (cancelar)
//
// Fonte: contrato-tela-transferencia-maquinas-frontend.md §2/§FE-04 +
// fid-g3f-transferencia-maquinas.md §2.4 (de-para normativo — nenhum campo a
// mais). PROIBIDO tipar `id`/`farm_id`/`farm_out_id`/`user_id`/`employee_id`/
// `tenant_id`, ou `status` como inteiro cru fora de `status.value` — nenhum
// existe no contrato de resposta.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS (resposta da API)
// ============================================

/** `DB-ENUM-01` — exatamente 3 estados (OD-004: `2` é "Finalizado", NUNCA
 *  "Em Processamento" — não copiar o 4º estado fantasma do legado). */
export interface EquipmentTransferStatusRef {
  value: 1 | 2 | 3;
  label: string;
  color: string;
}

/** `farm`/`farm_out` — fazenda origem/destino. */
export interface EquipmentTransferRef {
  uuid: string;
  description: string;
}

/** `user`/`employee` — usuário que criou / funcionário que recebeu. */
export interface EquipmentTransferUserRef {
  uuid: string;
  name: string;
}

/** `equipments[]` — máquinas da transferência (LM-08). */
export interface EquipmentTransferEquipmentRef {
  uuid: string;
  description: string;
}

/** `attachments[]` — anexos (CL-30/CL-36). */
export interface EquipmentTransferAttachmentRef {
  uuid: string;
  name: string;
  url: string;
}

// ============================================
// LISTAGEM / DETALHE
// ============================================

export interface EquipmentTransferListItem {
  uuid: string;
  code: string;
  status: EquipmentTransferStatusRef;
  date: string | null;
  created_at: string;
  user: EquipmentTransferUserRef | null;
  farm: EquipmentTransferRef | null;
  farm_out: EquipmentTransferRef | null;
  equipments: EquipmentTransferEquipmentRef[];
}

export interface EquipmentTransferDetail extends EquipmentTransferListItem {
  /** Sempre presente na resposta; `null` antes do recebimento (CL-21). */
  receipt_date: string | null;
  /** Sempre presente na resposta; `null` antes do recebimento (CL-21). */
  employee: EquipmentTransferUserRef | null;
  attachments: EquipmentTransferAttachmentRef[];
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL, 10/página default)
// ============================================

export interface EquipmentTransfersListEnvelope {
  success: boolean;
  message: string;
  data: EquipmentTransferListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

// ============================================
// FORMULÁRIOS (estado interno do react-hook-form)
// ============================================

export interface EquipmentTransferAttachmentForm {
  name: string;
  file: File | null;
}

/** Formulário de criação — `/frota/transferencias/novo` (FE-09..FE-14). Um
 *  único `useForm` raiz com dois `useFieldArray` (`equipment_uuids`,
 *  `attachments`), submetido em UM POST multipart (fid-g3f §3.11 — sem
 *  abas, sem endpoint de filho). */
export interface EquipmentTransferForm {
  code: string;
  date: string;
  farm_out: Option<string> | null;
  equipment_uuids: Array<{ equipment_uuid: Option<string> | null }>;
  attachments: EquipmentTransferAttachmentForm[];
}

/** Formulário de recebimento — `/frota/transferencias/:uuid/receber` (FE-15/FE-16). */
export interface ReceiveEquipmentTransferForm {
  receipt_date: string | null;
  employee: Option<string> | null;
  attachments: EquipmentTransferAttachmentForm[];
}

/** Filtro de período da listagem (FE-10, `FI-01`/`FI-02`) — dois campos e
 *  nada mais; a API não aceita nenhum outro parâmetro de filtro. */
export interface EquipmentTransferFilterForm {
  start_date?: string;
  end_date?: string;
}
