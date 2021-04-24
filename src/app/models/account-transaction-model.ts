export class AccountTransactionModel {
  primaryKey?: string;
  userPrimaryKey?: string;
  receiptNo?: string;
  transactionPrimaryKey?: string;
  transactionType?: string;
  transactionSubType?: string;
  parentPrimaryKey?: string;
  parentType?: string;
  accountPrimaryKey?: string;
  cashDeskPrimaryKey?: string;
  amount?: number;
  amountType?: string;
  paidAmount?: number;
  insertDate?: number;
  termDate?: number;
}
