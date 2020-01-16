export class CustomerTargetModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  customerCode?: string;
  type?: string; // yearly, monthly, periodic
  beginMonth?: number;
  finishMonth?: number;
  year?: number;
  amount?: number;
  description?: string;
  isActive?: boolean;
  insertDate: number;
}
