import { ReactNode, useCallback, useEffect, useState } from "react";

import { useDisclosure, UseDisclosureReturn } from "@chakra-ui/react";
import { createContext } from "use-context-selector";
import { v4 as uuidv4 } from "uuid";

import { AlertStatus } from "@/components/Alert";

import { NotificationQueue } from "./components/NotificationQueue";

interface NotificationQueueProviderProps {
  children: ReactNode;
}

interface Notification {
  id: string;
  status: AlertStatus;
  title: string;
  content: string;
  viewed: boolean;
}

interface NotificationQueueContext {
  disclosure: UseDisclosureReturn;
  handleCloseNotificationQueue: () => void;
  toggleHasMinimized: () => void;
  handleAddNotification: (
    notification:
      | Omit<Notification, "id" | "viewed">
      | Omit<Notification, "id" | "viewed">[],
  ) => void;
  handleRemoveNotification: (id: string) => void;
  handleMarkNotificationAsViewed: (id: string) => void;
  handleMarkAllNotificationsAsViewed: () => void;
  handleClearReadNotifications: () => void;
  notificationQueue: Notification[];
  hasMinimized: boolean;
  hasAddedNotification: boolean;
  setHasAddedNotification: React.Dispatch<React.SetStateAction<boolean>>;
}

export const NotificationQueueContext = createContext(
  {} as NotificationQueueContext,
);

const LOCAL_STORAGE_KEY = "notificationQueue";

export function NotificationQueueProvider({
  children,
}: NotificationQueueProviderProps) {
  const disclosure = useDisclosure();
  const [hasMinimized, setHasMinimized] = useState(true);
  const [hasAddedNotification, setHasAddedNotification] = useState(false);
  const [notificationQueue, setNotificationQueue] = useState<Notification[]>(
    () => {
      try {
        const storedNotifications = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (storedNotifications) {
          const parsedNotifications: Notification[] =
            JSON.parse(storedNotifications);
          return parsedNotifications.map((n) => ({
            id: n.id,
            status: n.status,
            title: n.title,
            content: n.content,
            viewed: n.viewed ?? false,
          }));
        }
        return [];
      } catch (error) {
        console.error("Falha ao analisar notificações do localStorage:", error);
        return [];
      }
    },
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(notificationQueue),
      );
    } catch (error) {
      console.error("Falha ao salvar notificações no localStorage:", error);
    }
  }, [notificationQueue]);

  const handleCloseNotificationQueue = useCallback(() => {
    disclosure.onClose();
    setHasAddedNotification(false);
  }, [disclosure.onClose]);

  const handleAddNotification = useCallback(
    (
      notification:
        | Omit<Notification, "id" | "viewed">
        | Omit<Notification, "id" | "viewed">[],
    ) => {
      setNotificationQueue((state) => {
        const newNotifications = Array.isArray(notification)
          ? notification.map((n) => ({
              ...n,
              id: uuidv4(),
              viewed: false,
            }))
          : [
              {
                ...notification,
                id: uuidv4(),
                viewed: false,
              },
            ];
        return [...newNotifications, ...state];
      });
      if (!disclosure.open) disclosure.onOpen();
    },
    [disclosure.open],
  );

  const handleRemoveNotification = useCallback((id: string) => {
    setNotificationQueue((state) =>
      state.filter((notification) => notification.id !== id),
    );
  }, []);

  const handleMarkNotificationAsViewed = useCallback((id: string) => {
    setNotificationQueue((prevQueue) =>
      prevQueue.map((notification) =>
        notification.id === id
          ? { ...notification, viewed: true }
          : notification,
      ),
    );
  }, []);

  const handleMarkAllNotificationsAsViewed = useCallback(() => {
    setNotificationQueue((prevQueue) =>
      prevQueue.map((notification) => ({ ...notification, viewed: true })),
    );
  }, []);

  const handleClearReadNotifications = useCallback(() => {
    setNotificationQueue((prevQueue) =>
      prevQueue.filter((notification) => !notification.viewed),
    );
  }, []);

  const toggleHasMinimized = useCallback(() => {
    setHasMinimized((prevState) => !prevState);
  }, []);

  return (
    <NotificationQueueContext.Provider
      value={{
        disclosure,
        handleCloseNotificationQueue,
        handleAddNotification,
        handleRemoveNotification,
        handleMarkNotificationAsViewed,
        handleMarkAllNotificationsAsViewed,
        handleClearReadNotifications,
        notificationQueue,
        hasAddedNotification,
        setHasAddedNotification,
        hasMinimized,
        toggleHasMinimized,
      }}
    >
      {children}
      <NotificationQueue />
    </NotificationQueueContext.Provider>
  );
}
