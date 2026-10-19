import { Option } from "@/@types/option";
import { DocumentTypes } from "@/@types/v2/Admin/user";

import { documentTypes } from "../user-document-types";

const labels = new Map<DocumentTypes, string>([
  [documentTypes.cpf, "CPF-BR"],
  [documentTypes.cnpj, "CNPJ-BR"],
  [documentTypes.cuit, "CUIT-AR"],
  [documentTypes.cuil, "CUIL-AR"],
  [documentTypes.ssn, "SSN-US"],
  [documentTypes.ein, "EIN-US"],
]);

const getLabel = (role: DocumentTypes): string => labels.get(role)!;

const getOption = (role: DocumentTypes): Option<DocumentTypes> => ({
  label: getLabel(role),
  value: role,
});

const options: Option<DocumentTypes>[] = Array.from(labels).map(
  ([key, value]) => ({
    label: value,
    value: key,
  }),
);

export const userDocumentTypesOptions = {
  getLabel,
  getOption,
  options,
};
