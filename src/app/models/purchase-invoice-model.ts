export class PurchaseInvoiceModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  customerCode?: string;
  receiptNo?: string;
  type?: string; // purchase,return
  totalPrice?: number;
  totalPriceWithTax?: number;
  description?: string;
  insertDate?: number;
}
