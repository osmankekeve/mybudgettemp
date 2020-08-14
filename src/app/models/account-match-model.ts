export class AccountMatchModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  debitPrimaryKey: string;
  debitType?: string; // salesInvoice, purchaseInvoice, payment, accountVoucher
  debitParentPrimaryKey?: string;
  creditPrimaryKey?: string;
  creditType?: string; // salesInvoice, purchaseInvoice, collection, accountVoucher
  creditParentPrimaryKey?: string;
  amount?: number;
  insertDate: number;
}
