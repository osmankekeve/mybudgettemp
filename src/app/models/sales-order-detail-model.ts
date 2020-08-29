export class SalesOrderDetailModel {
  primaryKey?: string;
  orderPrimaryKey: string;
  productPrimaryKey: string;
  price?: number;
  defaultPrice?: number;
  discount1?: number;
  defaultDiscount1?: number;
  discount2?: number;
  defaultDiscount2?: number;
  quantity?: number;
  taxRate?: number;
  insertDate?: number;
  totalPrice?: number;
  totalPriceWithTax?: number;
  campaignPrimaryKey: string;
  unitPrimaryKey: string;
  unitValue: number;
}
