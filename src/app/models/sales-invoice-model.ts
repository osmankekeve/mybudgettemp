export class SalesInvoiceModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  customerCode?: string;
  accountPrimaryKey?: string;
  receiptNo?: string;
  type?: string; // sales,return
  totalPrice?: number;
  totalPriceWithTax?: number;
  description?: string;
  isActive?: boolean;
  insertDate?: number;
}
