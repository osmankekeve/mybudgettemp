export class CustomerAccountModel {
  primaryKey?: string;
  userPrimaryKey: string;
  customerPrimaryKey: string;
  name: string;
  currencyCode: string;
  description?: string;
  accountNo: string;
  bankName: string;
  isActive?: boolean;
  insertDate: number;
}
