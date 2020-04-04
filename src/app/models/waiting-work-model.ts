
export class WaitingWorkModel {
    parentType: string; // collection, payment, salesInvoice, purchaseInvoice, accountVoucher, cashDeskVoucher
    parentPrimaryKey: string;
    log: string;
    status: boolean;
    insertDate: number;
}
