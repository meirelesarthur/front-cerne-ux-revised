// src/@types/v2/Common/branding.d.ts
// Tipos da Marca personalizada de relatório (Custom Report Branding).
// Contrato da API (GB Cerne API v2): usuário (Ultra) em /api/v2/branding e equipe
// (Business/Enterprise) em /api/v2/teams/{id}/branding. Campos: nome da empresa,
// 4 cores hex, site, texto de rodapé e até 2 logos (primary/secondary).

export type BrandingLogoSlot = "primary" | "secondary";

export interface BrandingLogo {
  position: BrandingLogoSlot;
  /** URL assinada do GCS — expira em ~1h; refaça o GET para renovar. */
  url: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

export interface BrandingData {
  id: number;
  owner_type: "user" | "team";
  owner_id: number;
  company_name: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  text_color: string | null;
  website: string | null;
  footer_text: string | null;
  protected: boolean;
  logos: BrandingLogo[];
  created_at: string;
  updated_at: string;
}

/** Corpo do PUT (upsert). Todos opcionais, mas é preciso enviar ao menos um. */
export interface UpdateBrandingRequest {
  company_name?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  text_color?: string | null;
  website?: string | null;
  footer_text?: string | null;
}

/** Resposta enxuta dos endpoints de logo (id + estado dos logos). */
export interface BrandingLogoResponse {
  id: number;
  logos: BrandingLogo[];
}
