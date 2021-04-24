export class StockVoucherDetailModel {
  primaryKey?: string;
  voucherPrimaryKey: string;
  productPrimaryKey: string;
  unitPrimaryKey: string;
  amount: number;
  quantity: number;
  insertDate?: number;
}
