// Interface de tradução para Admin Tickets (Jira)

export interface AdminTicketsLanguage {
  singularLabel: string;
  pluralLabel: string;
  pageTitle: string;
  pageSubtitle: string;

  // Table columns
  columns: {
    id: string;
    summary: string;
    issueType: string;
    status: string;
    priority: string;
    assignedTo: string;
    user: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };

  // Filters
  filter: {
    status: string;
    statusPlaceholder: string;
    includeDeleted: string;
    includeDeletedPlaceholder: string;
    toDo: string;
    inProgress: string;
    done: string;
    closed: string;
  };

  // Actions
  actions: {
    view: string;
    delete: string;
    restore: string;
  };

  // Detail dialog
  detailDialog: {
    title: string;
    sections: {
      info: string;
      comments: string;
      attachments: string;
    };
    fields: {
      jiraKey: string;
      status: string;
      issueType: string;
      priority: string;
      assignedTo: string;
      createdAt: string;
      updatedAt: string;
      user: string;
      userEmail: string;
      notAssigned: string;
    };
    commentPlaceholder: string;
    sendComment: string;
    noComments: string;
    noAttachments: string;
    uploadImage: string;
  };

  // Delete dialog (hard delete)
  deleteDialog: {
    title: string;
    description: string;
    confirm: string;
  };

  // Restore dialog
  restoreDialog: {
    title: string;
    description: string;
    confirm: string;
  };

  // Toast messages
  toast: {
    deleted: string;
    restored: string;
    commentAdded: string;
    commentUpdated: string;
    attachmentAdded: string;
  };

  // Empty state
  noData: string;
}
