// src/constants/languages/languageEsEs/languageContadores.ts
// Traducción ES-ES del módulo CONTADOR (despacho contable — Registros Base,
// dominio Fiscal/Contable).

import { ModuleContadores } from '@/@types/language/module-contadores';

export const languageContadores: ModuleContadores = {
  contador: {
    singularLabel: 'Contador',
    list: {
      pageTitle: 'Contador',
      pageSubtitle: 'Administre los despachos contables vinculados a la finca.',
      deletedToast: 'Contador eliminado correctamente',
      table: {
        razaoSocial: 'Razón Social',
        nomeFantasia: 'Nombre Comercial',
        cnpj: 'CNPJ',
        city: 'Ciudad',
        fone: 'Teléfono',
      },
      actions: {
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún contador registrado.',
        descriptionEmpty: 'Comience agregando el primer despacho contable.',
        titleEmptyNoCreate: 'Ningún contador disponible.',
        descriptionEmptyNoCreate:
          'Aún no hay contadores vinculados a su finca. Póngase en contacto con el administrador de la plataforma.',
        titleFiltered: 'Ningún contador encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Contador',
      },
      error: {
        message: 'No fue posible cargar los contadores.',
        retry: 'Intentar de nuevo',
      },
    },
    filter: {
      title: 'Filtrar Contadores',
      search: 'Buscar',
      searchPlaceholder: 'Razón social, nombre comercial o CNPJ',
    },
    deleteBlocked: {
      title: 'No es posible eliminar',
      description:
        'Hay registros vinculados a este contador. Elimine o reasigne los vínculos abajo antes de eliminar',
      resourceLabel: '{resource} ({count})',
      tableLabels: {
        contador_issue: 'Emisor(es) Fiscal(es) vinculado(s)',
        cash_books: 'Libro Caja vinculado',
        integration_dominios: 'integración Domínio vinculada',
      },
    },
    form: {
      title: { create: 'Nuevo Contador', edit: 'Editar Contador' },
      subtitle: {
        create: 'Registre un nuevo despacho contable.',
        edit: 'Actualice los datos del despacho contable.',
      },
      fields: {
        razaoSocial: 'Razón Social',
        nomeFantasia: 'Nombre Comercial',
        cnpj: 'CPF / CNPJ',
        ie: 'Registro Estatal',
        rua: 'Calle',
        numero: 'Número',
        bairro: 'Barrio',
        cep: 'Código Postal',
        fone: 'Teléfono',
        email: 'Correo electrónico',
        cidadeUuid: 'Ciudad',
        issueUuids: 'Emisores Fiscales',
        autoSend: 'Envío automático del XML',
      },
      placeholders: {
        razaoSocial: 'Razón social del despacho',
        nomeFantasia: 'Nombre comercial',
        ie: 'Registro estatal',
        rua: 'Nombre de la calle',
        numero: 'Número',
        bairro: 'Barrio',
        email: 'correo@ejemplo.com',
        cidadeUuid: 'Buscar ciudad...',
      },
      issuesField: {
        searchPlaceholder: 'Buscar emisor fiscal...',
        selectAllLabel: 'Seleccionar todos',
        deselectAllLabel: 'Deseleccionar todos',
        selectedCountLabel: 'Número de registros seleccionados',
        emptyLabel: 'Ningún emisor fiscal elegible encontrado.',
        errorLabel: 'Error al cargar los emisores fiscales.',
        retryLabel: 'Intentar de nuevo',
      },
      cepAutofill: {
        notFound: {
          title: 'Código postal no encontrado',
          description: 'No encontramos ese código postal. Complete la dirección manualmente.',
        },
        cityNotResolved: {
          title: 'Ciudad no resuelta automáticamente',
          description:
            'Dirección completada, pero no fue posible identificar la ciudad — selecciónela manualmente.',
        },
        networkError: {
          title: 'Error al consultar la dirección',
          description:
            'No fue posible consultar el código postal ahora. Complete la dirección manualmente si es necesario.',
        },
      },
      validation: {
        razaoSocialRequired: 'La razón social es obligatoria',
        razaoSocialMaxLength: 'La razón social debe tener como máximo 80 caracteres',
        nomeFantasiaRequired: 'El nombre comercial es obligatorio',
        nomeFantasiaMaxLength: 'El nombre comercial debe tener como máximo 80 caracteres',
        cnpjRequired: 'El CNPJ es obligatorio',
        ieRequired: 'El registro estatal es obligatorio',
        invalidFields: 'Revise los campos resaltados.',
        ieMaxLength: 'El registro estatal debe tener como máximo 20 caracteres',
        ruaRequired: 'La calle es obligatoria',
        numeroRequired: 'El número es obligatorio',
        bairroRequired: 'El barrio es obligatorio',
        cepRequired: 'El código postal es obligatorio',
        foneRequired: 'El teléfono es obligatorio',
        emailRequired: 'El correo electrónico es obligatorio',
        emailInvalid: 'Ingrese un correo electrónico válido',
        cidadeRequired: 'La ciudad es obligatoria',
        issuesRequired: 'Seleccione al menos un Emisor Fiscal',
      },
    },
  },
};
