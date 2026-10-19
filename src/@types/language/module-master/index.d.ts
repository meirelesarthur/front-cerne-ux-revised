import { CompanyLanguage } from "./company";
import { ProfileLanguage } from "./profile";
import { UserLanguage } from "./user";

export interface ModuleMaster {
  titleModule: string;
  user: UserLanguage;
  company: CompanyLanguage;
  profile: ProfileLanguage;
}
