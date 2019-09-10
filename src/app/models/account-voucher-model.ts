export interface AccountVoucherModel {
    primaryKey?: string;
    userPrimaryKey?: string;
    type?: string; // debitVoucher, creditVoucher
    customerCode?: string;
    receiptNo?: string;
    cashDeskPrimaryKey?: string;
    amount?: number;
    description?: string;
    insertDate?: number;
}
