export class AccountVoucherModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  type?: string; // debitVoucher, creditVoucher
  customerCode?: string;
  accountPrimaryKey?: string;
  receiptNo?: string;
  cashDeskPrimaryKey?: string;
  amount?: number;
  description?: string;
  isActive?: boolean;
  insertDate?: number;
}
