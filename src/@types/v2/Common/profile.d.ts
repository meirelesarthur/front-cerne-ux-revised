// src/@types/v2/Common/profile.d.ts
// Interface para traduções da página de Perfil do Usuário

export interface ProfileLanguage {
  // Page header
  pageTitle: string;
  pageDescription: string;

  // Tabs
  tabs: {
    profile: string;
    security: string;
    sessions: string;
    aiModels: string;
    apiTokens: string;
    usage: string;
    mcpServers: string;
    branding: string;
  };

  // Profile Tab
  profileTab: {
    accountActive: string;
    accountInactive: string;
    statistics: string;
    pentestsCreated: string;
    vulnerabilities: string;
    aleexCredits: string;
    memberSince: string;
    personalInfo: string;
    editButton: string;
    username: string;
    email: string;
    creationDate: string;
    language: string;
    dangerZone: string;
    dangerZoneDescription: string;
    deleteAccount: string;
    deleteAccountWarning: string;
    deleteAccountSuccess: string;
    accountEntityName: string;
    uploadPhotoAriaLabel: string;
    noData: string;
    languageOptions: {
      ptBR: string;
      enUS: string;
      esES: string;
    };
  };

  // Security Tab
  securityTab: {
    password: string;
    lastChanged: string;
    daysAgo: string;
    changePassword: string;
    passwordRecommendation: string;
    twoFactorAuth: string;
    twoFactorDescription: string;
    enabled: string;
    disabled: string;
    enabledAt: string;
    backupCodes: string;
    backupCodesRemaining: string;
    regenerateBackupCodes: string;
    disable2FA: string;
    configure2FA: string;
    apiTokens: string;
    apiTokensDescription: string;
    manageTokens: string;
    activeTokens: string;
    tokensCount: string;
    revokeAll: string;
    revokeAllTitle: string;
    revokeAllDescription: string;
    revokeAllWarning: string;
    revokeAllConfirm: string;
    revokeAllSuccess: string;

    // Cabeçalho da página
    pageTitle: string;
    pageDescription: string;

    // Formulário de criação
    tokenNameLabel: string;
    tokenNamePlaceholder: string;
    createToken: string;
    createScopedToken: string;

    // Toggle de tipo (Full-Access / Scoped)
    fullAccess: string;
    fullAccessDescription: string;
    scoped: string;
    scopedDescription: string;

    // Scope Selector — Seção de Permissões
    permissionsTitle: string;
    permissionsDescription: string;
    permissionsByCategory: string;
    endpoints: string;
    detailedPermissions: string;
    noPermissionsAvailable: string;
    selectAtLeastOne: string;

    // Scope Selector — Seção de Times
    teamsTitle: string;
    teamsDescription: string;
    teamsOptional: string;
    teamPoolInfo: string;
    individualPoolInfo: string;
    noTeamsAvailable: string;

    // Token Card — Badges e informações
    fullAccessBadge: string;
    scopedBadge: string;
    created: string;
    lastUsed: string;
    never: string;
    editName: string;
    revokeToken: string;

    // Banner de token criado
    tokenCreatedTitle: string;
    tokenCreatedCopyWarning: string;
    copyToken: string;
    copiedToClipboard: string;
    dismiss: string;
    scopedTokenSummary: string;
    permissionsLabel: string;
    teamsLabel: string;

    // Informações de limites
    unlimitedTokens: string;
    tokensRemaining: string;

    // Empty state (nenhum token)
    noTokensTitle: string;
    noTokensDescription: string;

    // Edit dialog (editar nome do token)
    editTokenTitle: string;
    editTokenNameLabel: string;
    editTokenNamePlaceholder: string;

    // Revoke dialog (revogar token individual)
    revokeTokenTitle: string;
    revokeTokenDescription: string;
    revokeTokenWarning: string;
    revokeConfirm: string;

    // useRequest — entityName e mensagens personalizadas
    entityName: string;
    tokenUpdated: string;
    tokenRevoked: string;

    // Loading states
    loadingTokens: string;
    loadingPermissions: string;

    // Scope Selector — Hierarquia
    selectAll: string;
    permissionsCount: string;
    selectedCount: string;

    // Validação / Erros
    nameRequired: string;
    scopeRequired: string;
  };

  // Sessions Tab
  sessionsTab: {
    activeSessions: string;
    activeSessionsDescription: string;
    terminateAll: string;
    currentSession: string;
    loginHistory: string;
    success: string;
    failed: string;
    noActiveSessions: string;
    noLoginHistory: string;
    now: string;
    ago: string;
    hours: string;
    days: string;
    minutes: string;
    loading: string;
    entityName: string;
    terminateAllSuccess: string;
    revokeAriaLabel: string;
    revokeDialog: {
      title: string;
      description: string;
      warning: string;
      confirm: string;
    };
    terminateAllDialog: {
      title: string;
      description: string;
      warning: string;
      confirm: string;
    };
  };

  // Two Factor Authentication
  twoFactor: {
    title: string;
    description: string;
    enabled: string;
    disabled: string;
    enabledAt: string;
    backupCodesRemaining: string;
    lowBackupCodesWarning: string;
    regenerateBackupCodes: string;
    disable2FA: string;
    configure2FA: string;
    appRecommendation: string;

    // Setup Modal
    setupModalTitle: string;
    scanQRCode: string;
    enterDigitCode: string;
    cancel: string;
    enable2FA: string;

    // Disable Modal
    disableModalTitle: string;
    disableWarning: string;
    enterCodeConfirm: string;
    codePlaceholder: string;
    disableButton: string;

    // Regenerate Modal
    regenerateModalTitle: string;
    regenerateWarning: string;
    regenerateButton: string;

    // Backup Codes Modal
    backupCodesModalTitle: string;
    backupCodesImportant: string;
    copyCodes: string;
    savedCodes: string;
  };

  // Usage Tab
  usageTab: {
    stats: {
      operations: string;
      totalTokens: string;
      totalCost: string;
      budget: string;
      chatLabel: string;
      pentestsLabel: string;
      inputLabel: string;
      outputLabel: string;
      cacheReadLabel: string;
      cacheWriteLabel: string;
      includedLabel: string;
      onDemandLabel: string;
      unlimitedLabel: string;
      remainingLabel: string;
    };
    plan: {
      title: string;
      customPricing: string;
      perMonth: string;
      onDemand: {
        title: string;
        description: string;
      };
    };
    charts: {
      dailyCost: string;
      models: string;
      noData: string;
      noModels: string;
      opsLabel: string;
    };
    history: {
      title: string;
      columns: {
        type: string;
        model: string;
        agent: string;
        input: string;
        output: string;
        cacheRead: string;
        cacheWrite: string;
        cost: string;
        date: string;
      };
      noHistory: string;
      records: string;
    };
    loading: string;
    entity: string;
    toast: {
      onDemandUpdated: string;
    };
  };

  // Two Factor Verify Page (Login)
  twoFactorVerify: {
    title: string;
    backupCodeTitle: string;
    description: string;
    backupCodeDescription: string;
    backupCodePlaceholder: string;
    useAuthenticatorApp: string;
    lostAccess: string;
    back: string;
    verify: string;
    verifying: string;
    sessionExpired: string;
    invalidCode: string;
    invalidBackupCode: string;
  };
}
