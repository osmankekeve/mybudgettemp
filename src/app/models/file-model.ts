export class FileModel {
  primaryKey: string;
  userPrimaryKey?: string;
  parentPrimaryKey?: string;
  parentType: string; // shared, customer, user
  fileName: string;
  downloadURL: string;
  path: string;
  size: number;
  type: string;
  insertDate: number;
}
