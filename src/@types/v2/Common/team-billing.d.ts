export interface TeamBillingLanguage {
  banners: {
    paymentPending: {
      title: string;
      description: string;
      action: string;
    };
    gracePeriod: {
      title: string;
      description: string;
      action: string;
    };
    pastDue: {
      title: string;
      description: string;
      action: string;
    };
    suspended: {
      title: string;
      description: string;
      action: string;
    };
  };
  management: {
    title: string;
    manageSubscription: string;
    viewInvoices: string;
    reactivate: string;
  };
  blocked: {
    title: string;
    description: string;
  };
  toast: {
    reactivateSuccess: string;
    reactivateError: string;
  };
}
