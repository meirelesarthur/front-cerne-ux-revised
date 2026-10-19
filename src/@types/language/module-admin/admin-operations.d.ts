// Interface de tradução para Admin Operations

export interface AdminOperationsLanguage {
  pageTitle: string;
  pageSubtitle: string;
  entityName: string;
  columns: {
    id: string;
    input: string;
    output: string;
    model: string;
    status: string;
    operationType: string;
    type: string;
    userId: string;
    createdAt: string;
  };
  filters: {
    includeDeleted: string;
    includeDeletedPlaceholder: string;
    userId: string;
    userIdPlaceholder: string;
    operationType: string;
    operationTypePlaceholder: string;
    type: string;
    typePlaceholder: string;
    allTypes: string;
    web: string;
    api: string;
    pentest: string;
    chat: string;
  };
  detail: {
    title: string;
    userPrompt: string;
    alexResponse: string;
    timeTook: string;
    totalTokens: string;
    inputTokens: string;
    outputTokens: string;
    model: string;
    agent: string;
    pentestInfo: string;
    pentestName: string;
    pentestUrl: string;
    pentestType: string;
    pentestStatus: string;
    noPentest: string;
  };
  deleteDialog: {
    title: string;
    description: string;
  };
  forceDeleteDialog: {
    title: string;
    description: string;
  };
  restoreDialog: {
    title: string;
    description: string;
  };
  toast: {
    deleted: string;
    restored: string;
    forceDeleted: string;
  };
  noData: string;
  ariaLabels: {
    view: string;
    delete: string;
    restore: string;
    forceDelete: string;
  };
}
