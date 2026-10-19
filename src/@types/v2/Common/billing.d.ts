export interface BillingLanguage {
  menuLabel: string;
  pageTitle: string;
  pageSubtitle: string;
  subscription: {
    title: string;
    status: {
      active: string;
      canceling: string;
      pastDue: string;
      noSubscription: string;
    };
    renewsOn: string;
    cancelsOn: string;
    cancelWarning: string;
    pastDueWarning: string;
    interval: {
      month: string;
      year: string;
    };
  };
  invoices: {
    title: string;
    columns: {
      date: string;
      description: string;
      amount: string;
      status: string;
    };
    status: {
      paid: string;
      open: string;
      void: string;
      draft: string;
      uncollectible: string;
    };
    noInvoices: string;
    viewPdf: string;
  };
  buttons: {
    manageSubscription: string;
    reactivate: string;
    updatePayment: string;
    viewPlans: string;
    makeUpgrade: string;
  };
  toast: {
    portalError: string;
    portalRedirecting: string;
  };
}
