import { useContextSelector } from "use-context-selector";

import { ErrorLogContext } from "@/contexts/ErrorLogContext";

export default function useErrorLog() {
  const errorLogs = useContextSelector(
    ErrorLogContext,
    (ctx) => ctx.errorLogs,
  );

  const unreadCount = useContextSelector(
    ErrorLogContext,
    (ctx) => ctx.unreadCount,
  );

  const addErrorLog = useContextSelector(
    ErrorLogContext,
    (ctx) => ctx.addErrorLog,
  );

  const removeErrorLog = useContextSelector(
    ErrorLogContext,
    (ctx) => ctx.removeErrorLog,
  );

  const markAsViewed = useContextSelector(
    ErrorLogContext,
    (ctx) => ctx.markAsViewed,
  );

  const markAllAsViewed = useContextSelector(
    ErrorLogContext,
    (ctx) => ctx.markAllAsViewed,
  );

  const clearAllErrors = useContextSelector(
    ErrorLogContext,
    (ctx) => ctx.clearAllErrors,
  );

  return {
    errorLogs,
    unreadCount,
    addErrorLog,
    removeErrorLog,
    markAsViewed,
    markAllAsViewed,
    clearAllErrors,
  };
}
