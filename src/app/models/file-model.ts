export class FileModel {
  primaryKey: string;
  userPrimaryKey?: string;
  customerPrimaryKey?: string;
  parentType: string; // shared, customer, user
  fileName: string;
  downloadURL: string;
  path: string;
  size: number;
  type: string;
  insertDate: number;
}
