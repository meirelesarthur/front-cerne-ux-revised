import { Option } from "@/@types/option";
import { ContactData } from "./contact";
import { LocationData } from "./location";
import { PropertieData } from "./propertie";
import { RoleTypes } from "./role";
import { DocumentTypes } from "../user";
import { Label } from "@/@types/label";

export interface CompanyData {
  id: string;
  name: string;
  code: string;
  legalId: string;
  documentType: DocumentTypes;
  administrativeLocationId: string;
  realLocationId: string;
  enabled: boolean;
  property: string;
  type: RoleTypes;
}

export interface CompanyLanguage extends Label {
  name: string;
  code: string;
  legalId: string;
  documentType: string;
  administrativeLocationId: string;
  realLocationId: string;
  enabled: string;
  property: string;
  type: string;
  plant: Label;
  admin: Label;
}

export interface CreateOrUpdateCompany {
  name: string;
  code: string;
  legalId: string;
  property: string;
  type: RoleTypes;
  documentType: DocumentTypes;
}

export interface UpdateCompanyRequest {
  name?: string;
  code?: string;
  legalId?: string;
  property?: string;
  type?: RoleTypes;
  documentType?: DocumentTypes;
}

export interface CreateCompanyRelation {
  adminCompanyId: string;
  plantCompanyId: string;
}

export interface ActivateAndInactivateCompany {
  id: string;
  enabled: boolean;
}

export interface CompanyForm {
  id?: string;
  name: string;
  code: string;
  legalId: string;
  enabled?: boolean;
  property: string;
  type: RoleTypes;
  documentType: Option<DocumentTypes>;
}

export interface CompanyFilterForm {
  name: string;
  code: string;
  legalId: string;
  enabled: Option<boolean>;
}

export interface CompanyFilterForm {
  name: string;
  code: string;
  legalId: string;
  enabled: Option<boolean>;
  documentType?: Option<DocumentTypes>;
}

export interface CompanyFilterResquest {
  name?: string;
  code?: string;
  legalId?: string;
  enabled?: boolean;
  type?: RoleTypes;
  documentType?: DocumentTypes;
}
