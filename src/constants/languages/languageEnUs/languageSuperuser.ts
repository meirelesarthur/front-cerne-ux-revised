import { ModuleMaster } from "@/@types/language/module-master";

export const languageSuperuser: ModuleMaster = {
  titleModule: "Master",
  user: {
    singularLabel: "User",
    pluralLabel: "Users",
    displayName: "Display name",
    email: "Email",
    identifier: "Identifier",
    lastNames: "Last names",
    legalId: "SSN",
    names: "First name",
    phoneNumber: "Phone number",
    enabled: "Status",
    documentType: "Document type",
  },
  company: {
    singularLabel: "Company",
    pluralLabel: "Companies",
    administrativeLocationId: "Administrative location ID",
    code: "Code",
    enabled: "Status",
    legalId: "Legal ID",
    name: "Name",
    property: "Property",
    realLocationId: "Real location ID",
  },
  profile: {
    singularLabel: "Profile",
    pluralLabel: "Profiles",
    company: "Company",
    role: "Role",
  },
};
