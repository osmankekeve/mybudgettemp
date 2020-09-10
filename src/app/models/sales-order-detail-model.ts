import {currencyFormat} from '../core/correct-library';

export class SalesOrderDetailModel {
  primaryKey?: string;
  orderPrimaryKey: string;
  productPrimaryKey: string;
  listPrice?: number; // price on list
  price?: number; // price of employee typed
  defaultPrice?: number; // converted price of list price
  discount1?: number;
  defaultDiscount1?: number;
  discount2?: number;
  defaultDiscount2?: number;
  quantity?: number;
  invoicedQuantity?: number;
  taxRate?: number;
  insertDate?: number;
  totalPrice?: number; // iskonto1 ve iskont2 dusmus hali.
  totalPriceWithTax?: number; // totalPrice + kdv
  campaignPrimaryKey: string;
  unitPrimaryKey: string;
  unitValue: number;
}
