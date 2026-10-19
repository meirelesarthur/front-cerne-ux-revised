// src/@types/v2/Common/login/index.d.ts
// Interface de tradução para a página de Login

export interface LoginLanguage {
  /** Título de boas-vindas */
  welcomeTitle: string;
  /** Subtítulo da plataforma */
  platformSubtitle: string;
  /** Placeholder do campo email */
  emailPlaceholder: string;
  /** Placeholder do campo senha */
  passwordPlaceholder: string;
  /** Label "Lembrar-me" */
  rememberMe: string;
  /** Botão "Esqueci a senha" */
  forgotPassword: string;
  /** Botão "Criar conta" */
  createAccount: string;
  /** Botão de login */
  loginButton: string;
  /** Estado de carregamento */
  loading: string;
  /** Mensagem de erro de credenciais inválidas */
  invalidCredentials: string;
  /** Mensagem de erro genérica */
  genericError: string;
}
