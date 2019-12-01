export interface PurchaseInvoiceModel {
    primaryKey?: string;
    userPrimaryKey?: string;
    customerCode?: string;
    receiptNo?: string;
    type?: string; // purchase,return
    totalPrice?: number;
    totalPriceWithTax?: number;
    description?: string;
    insertDate?: number;
}
