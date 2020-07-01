export class CollectionModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  type?: string; // cash, creditCard, pNote
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
