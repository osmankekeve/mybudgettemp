export interface ReminderModel {
  primaryKey?: string;
  userPrimaryKey?: string;
  employeePrimaryKey?: string;
  isPersonal?: boolean;
  description?: string;
  periodType?: string; // daily, monthly, yearly, oneTime
  year?: number;
  month?: number;
  day?: number;
  reminderDate?: number;
  isActive?: boolean;
  insertDate?: number;
}
