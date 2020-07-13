export class ReminderModel {
  primaryKey?: string;
  userPrimaryKey?: string;
  employeePrimaryKey?: string;
  isPersonal?: boolean;
  description?: string;
  periodType?: string; // daily, monthly, yearly, oneTime
  parentType?: string; // customer, supplier, customer-supplier
  parentPrimaryKey?: string;
  parentTransactionType?: string; // salesInvoice, collection, purchaseInvoice, payment, accountVoucher, cashDeskVoucher, -1
  year?: number;
  month?: number;
  day?: number;
  reminderDate?: number;
  isActive?: boolean;
  insertDate?: number;
}
