export interface EmailVerificationLanguage {
  entityName: string;
  page: {
    loadingTitle: string;
    loadingDescription: string;
    successTitle: string;
    successDescription: string;
    errorTitle: string;
    errorDescription: string;
    tokenMissingTitle: string;
    tokenMissingDescription: string;
    goToHome: string;
    goToLogin: string;
    resendEmail: string;
  };
  banner: {
    message: string;
    resendButton: string;
    resendCooldown: string;
  };
  block: {
    tooltip: string;
    toastTitle: string;
    toastDescription: string;
  };
  gate: {
    title: string;
    description: string;
    checkInbox: string;
    spamWarning: string;
    resendButton: string;
    resendCooldown: string;
    logoutButton: string;
    refreshButton: string;
    refreshDescription: string;
  };
  toast: {
    resendSuccess: string;
    resendAlreadyVerified: string;
    resendRateLimited: string;
    resendError: string;
  };
}
