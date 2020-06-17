export class BuySaleModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  currencyPrimaryKey?: string;
  receiptNo?: string;
  transactionType?: string; // buy, sale
  cashDeskPrimaryKey?: string;
  unitAmount?: number;
  unitValue?: number;
  totalAmount?: number;
  description?: string;
  recordDate: number;
  status?: string; // waitingForApprove, approved, rejected
  approveByPrimaryKey?: string; // approved or rejected
  approveDate?: number;
  platform?: string; // mobile, web
  insertDate: number;
}
