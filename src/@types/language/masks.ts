import { DocumentTypesLabel } from "../v2/Admin/user";

interface DocumentDefault extends DocumentTypesLabel {
  defalt: string;
}

export interface Masks {
  document: DocumentDefault;
  documentLabel: DocumentDefault;
  cpf?: string;
  cep: string;
  mobileNumber: string;
  phoneNumber: string;
  fixedNumber: string;
  phoneWithCountryCode: string;
}
