export class BuySaleModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  currencyPrimaryKey?: string;
  transactionType?: string; // buy, sale
  cashDeskPrimaryKey?: string;
  unitAmount?: number;
  unitValue?: number;
  totalAmount?: number;
  description?: string;
  recordDate: number;
  insertDate: number;
}
