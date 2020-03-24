export class ProfileModel {
  primaryKey?: string;
  userPrimaryKey: string;
  employeePrimaryKey: string;
  longName?: string;
  mailAddress?: string;
  phone?: string;
  isMainRecord?: boolean;
  password?: string;
  type?: string; // admin, manager, user
  isActive?: boolean;
  birthDate?: number;
  insertDate: number;
}
