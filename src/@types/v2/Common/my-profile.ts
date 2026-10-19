// src/@types/v2/Common/my-profile.ts
// Tipos de i18n da tela "Meu perfil" (Execução 071, TASK-071-FE-01). Bloco
// NOVO (`myProfile`) — não reutiliza `ModuleCommon.profile` (template do 2FA).

export interface MyProfileLanguage {
  pageTitle: string;
  pageDescription: string;
  accountSummary: {
    title: string;
  };
  personalData: {
    title: string;
    photo: {
      changeButton: string;
      removeSelectionButton: string;
      hint: string;
      errorType: string;
      errorSize: string;
    };
    name: {
      label: string;
      requiredError: string;
      minError: string;
      maxError: string;
    };
    email: {
      label: string;
      hint: string;
    };
    discardButton: string;
    saveButton: string;
    saveSuccessMessage: string;
    loadErrorTitle: string;
    retryButton: string;
  };
  security: {
    title: string;
    currentPassword: {
      label: string;
      requiredError: string;
    };
    newPassword: {
      label: string;
      hint: string;
      requiredError: string;
      minError: string;
      sameAsCurrentError: string;
    };
    confirmPassword: {
      label: string;
      requiredError: string;
      mismatchError: string;
    };
    submitButton: string;
    saveSuccessMessage: string;
  };
}
