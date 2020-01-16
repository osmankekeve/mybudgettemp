export class CashdeskVoucherModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  type?: string; // open, transfer
  transactionType?: string; // debit, credit
  receiptNo?: string;
  firstCashDeskPrimaryKey?: string;
  secondCashDeskPrimaryKey?: string;
  amount?: number;
  description?: string;
  insertDate?: number;
}
