import {CustomerModel} from './customer-model';

export class PaymentModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  customerCode?: string;
  type?: string; // cash, creditCard, pNote
  receiptNo?: string;
  cashDeskPrimaryKey?: string;
  amount?: number;
  description?: string;
  insertDate?: number;
}
