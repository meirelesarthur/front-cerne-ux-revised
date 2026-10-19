import { Label } from "@/@types/label";

export interface CompanyLanguage extends Label {
  name: string;
  code: string;
  legalId: string,
  administrativeLocationId: string;
  realLocationId: string;
  enabled: string;
  property: string;
}
