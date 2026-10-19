import { ModuleMaster } from "@/@types/language/module-master";

export const languageSuperuser: ModuleMaster = {
  titleModule: "Master",
  user: {
    singularLabel: "Usuário",
    pluralLabel: "Usuários",
    displayName: "Nome de exibição",
    email: "E-mail",
    identifier: "Identificador",
    lastNames: "Sobrenome",
    legalId: "CPF/CNPJ",
    names: "Nome",
    phoneNumber: "Número de telefone",
    enabled: "Status",
    documentType: "Tipo de documento",
  },
  company: {
    singularLabel: "Empresa",
    pluralLabel: "Empresas",
    administrativeLocationId: "ID de localização administrativo",
    code: "Código",
    enabled: "Habilitado",
    legalId: "Identidade legal",
    name: "Nome",
    property: "Propriedade",
    realLocationId: "ID de localização real",
  },
  profile: {
    singularLabel: "Perfil",
    pluralLabel: "Perfis",
    company: "Empresa",
    role: "Papel",
  },
};
