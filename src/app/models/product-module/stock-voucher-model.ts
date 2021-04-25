export class StockVoucherModel {
  primaryKey?: string;
  userPrimaryKey: string;
  title: string;
  receiptNo: string;
  status: string; // waitingForApprove, approved, canceled
  type: string; // openingStock, positiveStockDifference, negativeStockDifference, consumableStock
  approveByPrimaryKey?: string; // approved or rejected
  approveDate?: number;
  storagePrimaryKey?: string;
  description?: string;
  documentDate: number;
  insertDate?: number;
}
