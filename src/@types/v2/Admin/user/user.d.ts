// import { Option } from "@/@types/option";
import { documentTypes } from "@/constants/admin/user/user-document-types";

import { ProfileData } from "./user-profile";

export type DocumentTypes = (typeof documentTypes)[keyof typeof documentTypes];
export type DocumentTypesLabel = Record<DocumentTypes, string>;

export interface UserData {
  identifier: string;
  email: string;
  displayName: string;
  names: string;
  lastNames: string;
  legalId: string;
  emails: string[];
  userProfiles: ProfileData[];
  enabled: boolean;
  created: Date;
  updated: Date;
  id: string;
  phoneNumber: string;
  loggedAs: string;
  loggedWithCompany: string;
  documentType: DocumentTypes;
  isNewUser: boolean;
}

export interface CreateOrUpdateUser {
  id?: string;
  identifier: string;
  email: string;
  displayName: string;
  names: string;
  lastNames: string;
  legalId: string;
  phoneNumber: string;
  // fiscalLocationId: string;
  // administrativeLocationId: string;
  documentType: DocumentTypes;
}

export interface UpdateUserRequest {
  email?: string;
  displayName?: string;
  names?: string;
  lastNames?: string;
  legalId?: string;
  phoneNumber?: string;
  documentType?: DocumentTypes;
}

export interface ActivateAndInactivateUser {
  id: string;
  enabled: boolean;
}

export interface UserForm {
  id?: string;
  identifier: string;
  email: string;
  displayName: string;
  names: string;
  lastNames: string;
  legalId: string;
  phoneNumber: string;
  // fiscalLocationId: string;
  // administrativeLocationId: string;
  documentType: Option<DocumentTypes>;
  enabled?: boolean;
}

export interface UserFilterForm {
  id?: string;
  identifier: string;
  email: string;
  displayName: string;
  names: string;
  lastNames: string;
  legalId: string;
  phoneNumber: string;
  // fiscalLocationId: string;
  // administrativeLocationId: string;
  enabled: Option<boolean>;
}

export interface UserFilterResquest {
  identifier: string;
  email: string;
  displayName: string;
  names: string;
  lastNames: string;
  legalId: string;
  phoneNumber: string;
  enabled: boolean;
}
