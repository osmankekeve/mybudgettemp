export class LogModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  type: string; // error, notification
  parentType: string; // collection, payment, salesInvoice, purchaseInvoice, customer, accountVoucher, cashdeskVoucher, cashDesk
  parentPrimaryKey: string;
  log: string;
  isActive: boolean;
  insertDate: number;
}
