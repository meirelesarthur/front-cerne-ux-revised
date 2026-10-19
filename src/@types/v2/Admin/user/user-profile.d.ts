import { Option } from "@/@types/option";
import { CompanyData } from "../company";
import { RoleTypes } from "../role";

export interface UserProfileData {
  id: string;
  role: RoleTypes;
  company: CompanyData;
}

export interface UserProfileForm {
  userId?: string;
  company: Option<string> & CompanyData;
}

export interface CreateUserProfile {
  userId: string;
  role: RoleTypes;
  companyId: string;
}
