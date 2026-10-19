import { Label } from "@/@types/label";
import {
  CustomerAddressData,
  CustomerAdminManagerData,
  CustomerData,
  CustomerLogisticManagerData,
  CustomerSellerManagerData,
} from "@/@types/v2/Admin/customer";

export interface CustomerLanguage
  extends Label,
    Omit<CustomerData, "id" | "companyId" | "enabled" | "created" | "updated"> {
  customerAddress: Omit<CustomerAddressData & Label, "customerId" | "id">;
  customerProductionManager: Omit<
    CustomerProductionManagerData & Label,
    "customerId" | "id"
  >;
  customerAdminManager: Omit<
    CustomerAdminManagerData & Label,
    "customerId" | "id"
  >;
  customerLogisticManager: Omit<
    CustomerLogisticManagerData & Label,
    "customerId" | "id"
  >;
  customerSellerManager: Omit<
    CustomerSellerManagerData & Label,
    "customerId" | "id"
  >;
  admin: string;
  tex: string;
  logistic: string;
  production: string;
  documentType: string;
}
