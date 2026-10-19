import { ModuleMaster } from "@/@types/language/module-master";

export const languageSuperuser: ModuleMaster = {
  titleModule: "Master",
  user: {
    singularLabel: "Usuario",
    pluralLabel: "Usuarios",
    displayName: "Nombre para mostrar",
    email: "Correo electrónico",
    identifier: "Identificador",
    lastNames: "Apellidos",
    legalId: "CUIT",
    names: "Nombre",
    phoneNumber: "Número de teléfono",
    enabled: "Estado",
    documentType: "Tipo de documento",
  },
  company: {
    singularLabel: "Compañía",
    pluralLabel: "Compañías",
    administrativeLocationId: "ID de ubicación administrativa",
    code: "Código",
    enabled: "Estado",
    legalId: "Identificación jurídica",
    name: "Nombre",
    property: "Propiedad",
    realLocationId: "ID de ubicación real",
  },
  profile: {
    singularLabel: "Perfil",
    pluralLabel: "Perfiles",
    company: "Compañía",
    role: "Rol",
  },
};
