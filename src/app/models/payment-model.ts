import {CustomerModel} from './customer-model';

export class PaymentModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  customerCode?: string;
  type?: string; // cash, creditCard, pNote
  accountPrimaryKey?: string;
  receiptNo?: string;
  cashDeskPrimaryKey?: string;
  amount?: number;
  description?: string;
  isActive?: boolean;
  insertDate?: number;
}
