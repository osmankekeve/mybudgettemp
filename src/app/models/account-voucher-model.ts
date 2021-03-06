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
  status?: string; // waitingForApprove, approved, rejected
  approveByPrimaryKey?: string; // approved or rejected
  approveDate?: number;
  platform?: string; // mobile, web
  insertDate?: number;
  recordDate?: number;
}
