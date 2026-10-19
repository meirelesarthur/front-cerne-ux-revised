import { TypesSituationAction } from "@/constants/options/types-situation-action";

import { ChangeStatusSituation } from "./change-status-situation";
import { ResponseSituation } from "./response-api";
import { SituationTypes } from "./situation";
import { CreateUserProfile } from "./v2/Admin/user";

export interface ModalSituationActionProps {
  isOpen: boolean;
  onClose: () => void;
  setSituation?: (situation: SituationTypes) => void;
  closeWindow?: boolean;
  asyncFunction: ({
    registrationId,
    situation,
  }: ChangeStatusSituation) => Promise<ResponseSituation>;
  registrationId: string;
  typeSituationAction: TypesSituationAction;
  entityName: string;
  queryKey: string;
}
