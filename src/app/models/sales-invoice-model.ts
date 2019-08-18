export interface SalesInvoiceModel {
    primaryKey?: string;
    userPrimaryKey?: string;
    customerCode?: string;
    receiptNo?: string;
    type?: string; // sales,return
    description?: string;
    totalPrice?: number;
    totalPriceWithTax?: number;
    insertDate?: Date;
}
