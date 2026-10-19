// src/@types/v2/BaseRegistrations/platformDocuments/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo Termos e Condições (PlatformDocument) — API v1 do backend
// Laravel GB.Cerne, execução 032, TASK-FE-2500. Catálogo técnico GLOBAL do
// sistema (sem `farm_id`/tenancy — mesma exceção de `Bank`/`Partner`/
// `SystemUpdate`/`Permission`).
//
// Fonte: contrato de tela `contrato-front-termos-condicoes.md` §3 e §5.1
// (CONTRATO_AUTOAPROVADO — backend ainda não materializado nesta sessão, os
// shapes abaixo já são literais do contrato aprovado).
//
// Settings-form de registro único (SEM listagem, SEM `/novo`/`/:uuid`) — 1
// única linha (`uuid`) com 2 famílias de campos independentes
// (`terms_of_use`/`privacy_policy`), cada uma espelhando
// `PlatformDocumentResource` do backend.
// -----------------------------------------------------------------------------

export interface PlatformDocumentEntry {
  original_filename: string | null;
  url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by_name: string | null;
  uploaded_at: string | null;
}

export interface PlatformDocumentData {
  uuid: string;
  terms_of_use: PlatformDocumentEntry;
  privacy_policy: PlatformDocumentEntry;
  created_at: string | null;
  updated_at: string | null;
}

// Envelope de resposta dos 2 POSTs (`terms-of-use`/`privacy-policy`) — o
// backend devolve a linha singleton INTEIRA a cada upload (as 2 famílias de
// campos, não só a que mudou), mesmo shape completo de `PlatformDocumentData`.
export interface UploadPlatformDocumentResponse extends PlatformDocumentData {}
