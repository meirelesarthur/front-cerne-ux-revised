import { getCompanySystemGB, getUserSystem } from "@/utils/auth-token";

export function useUser() {
  const user = getUserSystem();
  const company = getCompanySystemGB();

  return {
    user,
    company,
  };
}
