import { CustomerModel } from './customer-model';

export interface PurchaseInvoiceModel {
    primaryKey? : string,
    userPrimaryKey? : string,
    customerCode? : string,
    receiptNo? : string,
    type? : string, //purchase,return
    description? : string,
    totalPrice? : number,
    totalPriceWithTax? : number,
    customer? : CustomerModel
}