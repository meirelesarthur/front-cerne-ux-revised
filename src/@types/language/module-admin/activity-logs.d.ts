// ============================================
// INTERFACE: ACTIVITY LOGS (Audit Log)
// ============================================

export interface ActivityLogsLanguage {
  singularLabel: string;
  pluralLabel: string;
  pageTitle: string;
  pageSubtitle: string;

  // Tabs
  tabs: {
    dashboard: string;
    logs: string;
  };

  // Table columns
  table: {
    id: string;
    dateTime: string;
    action: string;
    entity: string;
    severity: string;
    description: string;
    user: string;
    ip: string;
    method: string;
    status: string;
    duration: string;
    details: string;
  };

  // Filter sidebar
  filter: {
    action: string;
    actionPlaceholder: string;
    severity: string;
    severityPlaceholder: string;
    entityType: string;
    entityTypePlaceholder: string;
    httpMethod: string;
    httpMethodPlaceholder: string;
    responseCode: string;
    responseCodePlaceholder: string;
    userId: string;
    userIdPlaceholder: string;
    entityId: string;
    entityIdPlaceholder: string;
    ipAddress: string;
    ipAddressPlaceholder: string;
    search: string;
    searchPlaceholder: string;
    dateFrom: string;
    dateTo: string;
  };

  // Header buttons
  buttons: {
    purgeLogs: string;
    exportCsv: string;
  };

  // Purge dialog
  purgeDialog: {
    title: string;
    description: string;
    warning: string;
    cancel: string;
    confirm: string;
  };

  // Detail dialog
  detailDialog: {
    title: string;
    close: string;
    noDetail: string;
    sections: {
      action: string;
      severity: string;
      entity: string;
      dateTime: string;
      description: string;
      requestInfo: string;
      user: string;
      team: string;
      ip: string;
      duration: string;
      methodPath: string;
      responseCode: string;
      userAgent: string;
      requestBody: string;
      metadata: string;
      changes: string;
    };
  };

  // Stats / Dashboard
  stats: {
    totalEvents: string;
    info: string;
    warning: string;
    critical: string;
    dailyActivity: string;
    actionsByType: string;
    mostAffectedEntities: string;
    topUsers: string;
    severityDistribution: string;
  };

  // Toast
  toast: {
    purgeSuccess: string;
  };
}
