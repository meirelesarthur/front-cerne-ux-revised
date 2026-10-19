// src/@types/v2/Common/branding-language.d.ts
// Traduções da Marca personalizada de relatório (usada por Perfil (usuário) e Equipe).

export interface BrandingLanguage {
  title: string;
  description: string;
  teamTitle: string;
  teamDescription: string;

  // Gating (plano insuficiente)
  lockedTitleUser: string;
  lockedDescriptionUser: string;
  lockedTitleTeam: string;
  lockedDescriptionTeam: string;

  // Logo
  logoSectionLabel: string;
  logoHint: string;
  logoPrimary: string;
  logoSecondary: string;
  uploadLogo: string;
  removeLogo: string;
  dropzone: string;

  // Cores
  colorsLabel: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;

  // Campos
  companyName: string;
  companyNamePlaceholder: string;
  website: string;
  websitePlaceholder: string;
  footerText: string;
  footerTextPlaceholder: string;

  // Pré-visualização
  previewLabel: string;
  previewBadge: string;
  previewTitlePlaceholder: string;

  // Ações
  save: string;
  reset: string;
  deleteBrand: string;

  // Estados
  loading: string;
  emptyTitle: string;
  emptyDescription: string;

  // useRequest / toasts
  entityName: string;
  saved: string;
  deleted: string;
  logoUploaded: string;
  logoRemoved: string;

  // Validação
  invalidColor: string;
  atLeastOneField: string;
  invalidImage: string;
  imageTooLarge: string;

  // Confirmação de exclusão
  deleteTitle: string;
  deleteDescription: string;
  deleteConfirm: string;
  cancel: string;
}
