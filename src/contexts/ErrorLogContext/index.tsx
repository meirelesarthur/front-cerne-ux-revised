import { ReactNode, useCallback, useEffect, useState } from "react";

import { createContext } from "use-context-selector";
import { v4 as uuidv4 } from "uuid";

import {
  registerErrorLogHandler,
  unregisterErrorLogHandler,
  ErrorLogPayload,
} from "@/utils/errorLogEmitter";

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode: number | null;
  errorMessage: string;
  requestHeaders: Record<string, string>;
  requestPayload: unknown | null;
  responseBody: unknown | null;
  viewed: boolean;
}

interface ErrorLogContextData {
  errorLogs: ErrorLogEntry[];
  unreadCount: number;
  addErrorLog: (entry: Omit<ErrorLogEntry, "id" | "timestamp" | "viewed">) => void;
  removeErrorLog: (id: string) => void;
  markAsViewed: (id: string) => void;
  markAllAsViewed: () => void;
  clearAllErrors: () => void;
}

export const ErrorLogContext = createContext({} as ErrorLogContextData);

const LOCAL_STORAGE_KEY = "errorLogQueue";
const MAX_ENTRIES = 100;

interface ErrorLogProviderProps {
  children: ReactNode;
}

export function ErrorLogProvider({ children }: ErrorLogProviderProps) {
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as ErrorLogEntry[];
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(errorLogs));
    } catch {
      // silent
    }
  }, [errorLogs]);

  const unreadCount = errorLogs.filter((e) => !e.viewed).length;

  const addErrorLog = useCallback(
    (entry: Omit<ErrorLogEntry, "id" | "timestamp" | "viewed">) => {
      const newEntry: ErrorLogEntry = {
        ...entry,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        viewed: false,
      };
      setErrorLogs((prev) => [newEntry, ...prev].slice(0, MAX_ENTRIES));
    },
    [],
  );

  // Registra o handler global para que erros emitidos de qualquer lugar
  // (interceptor axios, fetch streaming, etc.) sejam capturados
  useEffect(() => {
    registerErrorLogHandler((payload: ErrorLogPayload) => {
      addErrorLog(payload);
    });
    return () => unregisterErrorLogHandler();
  }, [addErrorLog]);

  const removeErrorLog = useCallback((id: string) => {
    setErrorLogs((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const markAsViewed = useCallback((id: string) => {
    setErrorLogs((prev) =>
      prev.map((e) => (e.id === id ? { ...e, viewed: true } : e)),
    );
  }, []);

  const markAllAsViewed = useCallback(() => {
    setErrorLogs((prev) => prev.map((e) => ({ ...e, viewed: true })));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrorLogs([]);
  }, []);

  return (
    <ErrorLogContext.Provider
      value={{
        errorLogs,
        unreadCount,
        addErrorLog,
        removeErrorLog,
        markAsViewed,
        markAllAsViewed,
        clearAllErrors,
      }}
    >
      {children}
    </ErrorLogContext.Provider>
  );
}
