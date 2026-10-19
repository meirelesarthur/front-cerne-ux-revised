import { useContextSelector } from "use-context-selector";

import { NotificationQueueContext } from "@/contexts/NotificationQueueContext";

export default function useNotificationQueue() {
  const handleRemoveNotification = useContextSelector(
    NotificationQueueContext,
    (notification) => notification.handleRemoveNotification,
  );

  const disclosure = useContextSelector(
    NotificationQueueContext,
    (notification) => notification.disclosure,
  );

  const handleAddNotification = useContextSelector(
    NotificationQueueContext,
    (notification) => notification.handleAddNotification,
  );

  const handleCloseNotificationQueue = useContextSelector(
    NotificationQueueContext,
    (notification) => notification.handleCloseNotificationQueue,
  );

  const hasMinimized = useContextSelector(
    NotificationQueueContext,
    (notification) => notification.hasMinimized,
  );

  const notificationQueue = useContextSelector(
    NotificationQueueContext,
    (notification) => notification.notificationQueue,
  );

  const toggleHasMinimized = useContextSelector(
    NotificationQueueContext,
    (notification) => notification.toggleHasMinimized,
  );

  const hasAddedNotification = useContextSelector(
    NotificationQueueContext,
    (notification) => notification.hasAddedNotification,
  );

  const setHasAddedNotification = useContextSelector(
    NotificationQueueContext,
    (notification) => notification.setHasAddedNotification,
  );

  const handleMarkNotificationAsViewed = useContextSelector(
    NotificationQueueContext,
    (notification) => notification.handleMarkNotificationAsViewed,
  );

  const handleClearReadNotifications = useContextSelector(
    NotificationQueueContext,
    (notification) => notification.handleClearReadNotifications,
  );

  const handleMarkAllNotificationsAsViewed = useContextSelector(
    NotificationQueueContext,
    (notification) => notification.handleMarkAllNotificationsAsViewed,
  );

  return {
    hasAddedNotification,
    setHasAddedNotification,
    handleRemoveNotification,
    disclosure,
    handleAddNotification,
    handleCloseNotificationQueue,
    hasMinimized,
    notificationQueue,
    handleMarkNotificationAsViewed,
    toggleHasMinimized,
    handleMarkAllNotificationsAsViewed,
    handleClearReadNotifications,
  };
}
