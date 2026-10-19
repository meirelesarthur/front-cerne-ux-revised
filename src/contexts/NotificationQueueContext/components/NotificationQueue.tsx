import {
  JSXElementConstructor,
  ReactElement,
  ReactFragment,
  ReactPortal,
} from "react";

import {
  CloseButton,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  VStack,
} from "@chakra-ui/react";
import { MdExpandLess, MdMinimize } from "react-icons/md";

import { AlertStatus } from "@/components/Alert";
import { Button } from "@/components/Button";

import { useLanguage } from "@/hooks/useLanguage";
import useNotificationQueue from "@/hooks/useNotificationQueue";

import { Notification } from "./Notification";

export function NotificationQueue() {
  const {
    handleCloseNotificationQueue,
    handleRemoveNotification,
    notificationQueue,
    disclosure,
    hasMinimized,
    toggleHasMinimized,
    handleMarkNotificationAsViewed,
    handleMarkAllNotificationsAsViewed,
    handleClearReadNotifications: handleClearAllNotifications,
  } = useNotificationQueue();
  const { languageGB } = useLanguage();

  const unreadNotificationsCount = notificationQueue.filter(
    (notification: { viewed: any }) => !notification.viewed,
  ).length;

  return (
    <Flex
      flexDirection="column"
      width="460px"
      maxWidth="calc(100% - 2rem)"
      position="fixed"
      right="2"
      bottom="2"
      top={hasMinimized ? "auto" : "16"}
      maxHeight={
        disclosure?.open ? (hasMinimized ? "240px" : "calc(100vh - 2rem)") : "0"
      }
      borderRadius="5px"
      backgroundColor="primitiveBG"
      overflow="hidden"
      zIndex="tooltip"
      boxShadow="0px 2px 10px rgba(0, 0, 0, 0.161)"
      transition="max-height 0.6s ease-in-out, top 0.6s ease-in-out"
    >
      <Flex
        as="header"
        justifyContent="space-between"
        alignItems="center"
        padding="4"
        color="white"
        backgroundColor="gray.700"
        transition="background-color 0.3s"
        maxHeight="12"
      >
        <Heading as="h1" fontSize="sm" fontWeight="bold">
          {languageGB.defaltStrings.notifications} ({notificationQueue.length})
          {unreadNotificationsCount > 0 &&
            ` (${unreadNotificationsCount} ${unreadNotificationsCount === 1 ? languageGB.defaltStrings.unread.singularLabel : languageGB.defaltStrings.unread.pluralLabel})`}
        </Heading>
        <HStack>
          <IconButton
            aria-label="teste"
            variant="ghost"
            color="gray.300"
            fontSize="xl"
            size="xs"
            onClick={toggleHasMinimized}
          >
            {hasMinimized ? (
              <Icon as={MdExpandLess} />
            ) : (
              <Icon as={MdMinimize} />
            )}
          </IconButton>
          <CloseButton
            color="gray.300"
            size="sm"
            onClick={handleCloseNotificationQueue}
          />
        </HStack>
      </Flex>
      <VStack
        as="section"
        gap="3"
        flexDirection="column"
        padding="4"
        overflowY="scroll"
        flex="1"
      >
        {notificationQueue.map(
          (notification: {
            id: string;
            status: AlertStatus;
            title: string | undefined;
            content:
              | string
              | number
              | boolean
              | ReactElement<any, string | JSXElementConstructor<any>>
              | ReactFragment
              | ReactPortal
              | null
              | undefined;
            viewed: boolean | undefined;
          }) => (
            <Notification
              key={notification.id}
              status={notification.status!}
              title={notification.title!}
              description={notification.content!}
              onClose={() => handleRemoveNotification(notification.id)}
              onView={() => handleMarkNotificationAsViewed(notification.id)}
              viewed={notification.viewed}
              toggleHasMinimized={toggleHasMinimized}
              hasMinimized={hasMinimized}
            ></Notification>
          ),
        )}
      </VStack>
      <Flex
        flexDirection="row"
        paddingX="4"
        paddingBottom="4"
        justifyContent="space-between"
      >
        <Button
          title={languageGB.defaltStrings.clearAllNotifications}
          tooltip={languageGB.defaltStrings.clearAllNotificationsToolTip}
          variant="ghost"
          p="0"
          color="semanticNeutral.900"
          height="4"
          marginTop="4"
          onClick={handleClearAllNotifications}
        />
        <Button
          title={languageGB.defaltStrings.markAsRead}
          tooltip={languageGB.defaltStrings.markAsReadToolTip}
          variant="ghost"
          p="0"
          color="semanticNeutral.900"
          height="4"
          marginTop="4"
          onClick={handleMarkAllNotificationsAsViewed}
        />
      </Flex>
    </Flex>
  );
}
