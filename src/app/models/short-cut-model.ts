export class ShortCutRecordModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  parentRecordPrimaryKey: string;
  parentRecordType: string; // salesOrder, purchaseOrder, accountVoucher, stockVoucher
  title?: string;
  insertDate?: number;
}
