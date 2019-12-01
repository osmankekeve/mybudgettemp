export interface SalesInvoiceModel {
    primaryKey?: string;
    userPrimaryKey?: string;
    customerCode?: string;
    receiptNo?: string;
    type?: string; // sales,return
    totalPrice?: number;
    totalPriceWithTax?: number;
    description?: string;
    insertDate?: number;
}
