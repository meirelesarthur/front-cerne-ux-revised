import { ReactNode, useCallback, useEffect, useState } from "react";

import { useDisclosure, UseDisclosureReturn } from "@chakra-ui/react";
import { createContext } from "use-context-selector";

import { generateClientId } from '@/utils/guid';

import { PendencyQueue } from "./components/PendencyQueue";

interface PendencyQueueProviderProps {
  children: ReactNode;
}

interface Pendency {
  id: string;
  status: any;
  title: string;
  content: string;
  viewed: boolean;
}

interface PendencyQueueContext {
  disclosure: UseDisclosureReturn;
  handleClosePendencyQueue: () => void;
  toggleHasMinimized: () => void;
  handleAddPendency: (
    pendency: Omit<Pendency, "id"> | Omit<Pendency, "id">[],
  ) => void;
  handleRemovePendency: (id: string) => void;
  pendencyQueue: Pendency[];
  hasMinimized: boolean;
  hasAddedPendency: boolean;
  setHasAddedPendency: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PendencyQueueContext = createContext({} as PendencyQueueContext);

const LOCAL_STORAGE_KEY = "pendencyQueue";

export function PendencyQueueProvider({
  children,
}: PendencyQueueProviderProps) {
  const disclosure = useDisclosure();
  const [hasMinimized, setHasMinimized] = useState(false);
  const [hasAddedPendency, setHasAddedPendency] = useState(false);
  const [pendencyQueue, setPendencyQueue] = useState<Pendency[]>(() => {
    try {
      const storedPendencies = localStorage.getItem(LOCAL_STORAGE_KEY);
      return storedPendencies ? JSON.parse(storedPendencies) : [];
    } catch (error) {
      console.error("Failed to parse pendencies from localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(pendencyQueue));
    } catch (error) {
      console.error("Failed to save pendencies to localStorage:", error);
    }
  }, [pendencyQueue]);

  const handleClearQueue = useCallback(() => {
    setPendencyQueue([]);
  }, []);

  const handleClosePendencyQueue = useCallback(() => {
    disclosure.onClose();

    setHasAddedPendency(false);
  }, [disclosure.onClose]);

  const handleAddPendency = useCallback(
    (pendency: Omit<Pendency, "id"> | Omit<Pendency, "id">[]) => {
      setPendencyQueue((state) => {
        const newPendencies = Array.isArray(pendency)
          ? pendency.map((p) => ({ ...p, id: generateClientId() }))
          : [{ ...pendency, id: generateClientId() }];
        return [...newPendencies, ...state];
      });
      if (!disclosure.open) disclosure.onOpen();
    },
    [disclosure.open],
  );

  const handleRemovePendency = useCallback((id: string) => {
    setPendencyQueue((state) => state.filter((pendency) => pendency.id !== id));
  }, []);

  const toggleHasMinimized = useCallback(() => {
    setHasMinimized((prevState) => !prevState);
  }, []);

  return (
    <PendencyQueueContext.Provider
      value={{
        disclosure,
        handleClosePendencyQueue,
        handleAddPendency,
        handleRemovePendency,
        toggleHasMinimized,
        pendencyQueue,
        hasMinimized,
        hasAddedPendency,
        setHasAddedPendency,
      }}
    >
      {children}
      <PendencyQueue />
    </PendencyQueueContext.Provider>
  );
}
