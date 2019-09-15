import { CustomerModel } from './customer-model';

export class PaymentModel {
    primaryKey?: string;
    userPrimaryKey?: string;
    type?: string; // cash, creditCard, pNote
    customerCode?: string;
    receiptNo?: string;
    cashDeskPrimaryKey?: string;
    amount?: number;
    description?: string;
    insertDate?: number;
}
