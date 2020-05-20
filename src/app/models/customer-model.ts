export class CustomerModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  executivePrimary?: string;
  code?: string;
  name?: string;
  customerType?: string; // customer, supplier, customer-supplier
  owner?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
  taxOffice?: string;
  taxNumber?: string;
  postCode?: string;
  paymentTypeKey?: string;
  termKey?: string;
  defaultAccountPrimaryKey?: string;
}
