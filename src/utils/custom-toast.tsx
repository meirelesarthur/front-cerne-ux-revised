import { ReactNode } from "react";

import { IconType } from "react-icons";

import { Alert, AlertStatus } from "@/components/Alert";
import { AlertUpdate } from "@/components/AlertUpdate";

interface CustomToastProps {
  description: string | ReactNode;
  alertUpdate?: boolean;
  icon?: IconType;
  status?: AlertStatus;
  duration?: number;
  title?: string;
}

export default function customToast({
  status = "info",
  description,
  icon,
  alertUpdate,
  duration,
  title,
}: CustomToastProps) {
  const toastStatus = status === "edit" ? "success" : status;
  return {
    title,
    description: typeof description === "string" ? description : "",
    status: toastStatus,
    duration: duration ? duration : 7000,
    meta: {
      closable: true,
    },
    render: ({ onClose }: { onClose: () => void }) =>
      alertUpdate ? (
        <AlertUpdate
          onClose={onClose}
          status={toastStatus}
          description={description}
          icon={icon}
        />
      ) : (
        <Alert
          onClose={onClose}
          description={description}
          icon={icon}
          status={toastStatus}
        />
      ),
  };
}
