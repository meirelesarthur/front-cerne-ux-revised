// src/@types/v2/Common/register/index.d.ts
// Interface de tradução para a página de Registro

export interface RegisterLanguage {
  /** Título da página de criação de conta */
  title: string;
  /** Placeholder do campo nome completo */
  fullNamePlaceholder: string;
  /** Placeholder do campo email */
  emailPlaceholder: string;
  /** Placeholder do campo senha */
  passwordPlaceholder: string;
  /** Placeholder do campo confirmar senha */
  confirmPasswordPlaceholder: string;
  /** Placeholder do campo país */
  countryPlaceholder: string;
  /** Placeholder do campo região */
  regionPlaceholder: string;
  /** Placeholder do campo idioma */
  languagePlaceholder: string;
  /** Botão voltar para login */
  backToLogin: string;
  /** Botão criar conta */
  createAccountButton: string;
  /** Estado de carregamento */
  loading: string;
  /** Mensagem de sucesso ao criar conta */
  successMessage: string;
  /** Erro: senhas não coincidem */
  passwordMismatch: string;
  /** Erro: email já em uso */
  emailAlreadyInUse: string;
  /** Erro: senha muito fraca */
  weakPassword: string;
  /** Erro genérico */
  genericError: string;
  /** Texto quando não há regiões disponíveis para o país selecionado */
  noRegionsAvailable: string;
  /** Dialog de verificação de e-mail */
  emailVerificationDialog: {
    /** Título do dialog */
    title: string;
    /** Descrição principal */
    description: string;
    /** Instrução para verificar a caixa de entrada */
    checkInbox: string;
    /** Aviso sobre spam */
    spamWarning: string;
    /** Botão para ir ao login */
    goToLogin: string;
  };
}
