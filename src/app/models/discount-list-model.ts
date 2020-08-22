export class DiscountListModel {
  primaryKey?: string;
  userPrimaryKey: string;
  listName: string;
  type: string; // sales, purchase
  isActive: boolean;
  description?: string;
  beginDate: number;
  finishDate: number;
  insertDate?: number;
}
