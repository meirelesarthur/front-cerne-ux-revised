// Interface de tradução para Admin Chats

export interface AdminChatsLanguage {
  pageTitle: string;
  pageSubtitle: string;
  entityName: string;

  // Filter sidebar
  filter: {
    includeArchived: string;
    includeArchivedPlaceholder: string;
    includeDeleted: string;
    includeDeletedPlaceholder: string;
    search: string;
    searchPlaceholder: string;
  };

  // Columns
  columns: {
    id: string;
    name: string;
    user: string;
    operations: string;
    lastActivity: string;
    status: string;
    createdAt: string;
  };

  // ViewChat
  viewChat: {
    title: string;
    notFound: string;
    back: string;
    owner: string;
    operations: string;
    lastActivity: string;
    teams: string;
    noTeams: string;
    rename: string;
    renameTitle: string;
    chatName: string;
    chatNamePlaceholder: string;
    archive: string;
    unarchive: string;
    delete: string;
    restore: string;
    permanentDelete: string;
    softDeleteWarning: string;
    permanentDeleteWarning: string;
    chatDeleteWarning: string;
    chatPermanentDeleteWarning: string;
    operationsTable: {
      id: string;
      prompt: string;
      response: string;
      user: string;
      model: string;
      tokens: string;
      status: string;
      createdAt: string;
    };
    badges: {
      active: string;
      deleted: string;
      archived: string;
    };
    toast: {
      renamed: string;
      archived: string;
      unarchived: string;
      deleted: string;
      restored: string;
      permanentDeleted: string;
      operationDeleted: string;
      operationRestored: string;
      operationPermanentDeleted: string;
    };
  };
}
