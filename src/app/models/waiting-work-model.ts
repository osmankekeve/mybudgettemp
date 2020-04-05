export class WaitingWorkModel {
  transactionType: string; // collection, payment, salesInvoice, purchaseInvoice, accountVoucher, cashDeskVoucher
  transactionPrimaryKey: string;
  log: string;
  status: boolean;
  insertDate: number;
}
