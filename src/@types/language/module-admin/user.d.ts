import { Label } from "@/@types/label";

export interface UserLanguage extends Label {
  identifier: string;
  email: string;
  displayName: string;
  names: string;
  lastNames: string;
  legalId: string;
  phoneNumber: string;
  enabled: string;
  documentType: string;
}
