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
  status?: string; // waitingForApprove, approved, rejected
  approveByPrimaryKey?: string; // approved or rejected
  approveDate?: number;
  platform?: string; // mobile, web
  insertDate?: number;
  recordDate?: number;
}
