export interface PaymentModel {
    primaryKey?: string;
    userPrimaryKey?: string;
    type?: string; // cash, creditCard, pNote
    customerCode?: string;
    receiptNo?: string;
    cashDeskPrimaryKey?: string;
    amount?: number;
    description?: string;
    insertDate?: Date;
}
