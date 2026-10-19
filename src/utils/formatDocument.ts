import { DocumentTypes } from '@/@types/v2/Admin/user';

export const formatDocument = (document: string, documentType: DocumentTypes) => {
  if (!document || !documentType) {
    return null;
  }

  const documents = {
    cpf: document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
    // CNPJ alfanumérico: 12 primeiras [0-9A-Z], 2 últimas dígitos.
    cnpj: document
      .toUpperCase()
      .replace(/([0-9A-Z]{2})([0-9A-Z]{3})([0-9A-Z]{3})([0-9A-Z]{4})(\d{2})/, '$1.$2.$3/$4-$5'),
    cuit: document.replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3'),
    cuil: document.replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3'),
    ssn: document.replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3'),
    ein: document.replace(/(\d{2})(\d{7})/, '$1-$2'),
  };
  return documents[documentType];
};
