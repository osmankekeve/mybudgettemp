export class CustomerAccountModel {
  primaryKey?: string;
  userPrimaryKey: string;
  customerPrimaryKey: string;
  name: string;
  currencyCode: string;
  description?: string;
  isActive?: boolean;
  insertDate: number;
}
